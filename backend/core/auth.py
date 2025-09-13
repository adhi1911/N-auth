import requests
import uuid
from fastapi import Depends, HTTPException, status
from typing import Annotated
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import  HTTPBearer
from jose import jws, jwt, ExpiredSignatureError, JWTError, JWSError
from jose.exceptions import JWTClaimsError
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from core.database.models import UserSession


from .config import Config
from .schemas import SessionResponse, UserClaims
from .database.database import get_db

config = Config()
security = HTTPBearer()


jwks_url = f"https://{config.DOMAIN}/.well-known/jwks.json"

# temporary stash
PENDING_LOGINS={}

def get_public_key(kid: str):
    jwks = requests.get(jwks_url).json()
    for key in jwks["keys"]:
        if key["kid"] == kid:
            return key
        
    raise Exception("Public key not Found")

def validate_token(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]):

    try:
        ## Token Cleanup--
        if credentials.credentials.startswith("Bearer "):
            credentials.credentials = credentials.credentials[len("Bearer "):]
        # Strip quotes and whitespace
        credentials.credentials = credentials.credentials.strip().strip("'").strip('"')

        # print("Clean credentials.credentials repr:", repr(credentials.credentials))
        parts = credentials.credentials.split(".")
        # print("credentials.credentials parts count:", len(parts))
        if len(parts) != 3:
            raise ValueError("Invalid JWT format")

        ## processing the credentials.credentials
        # header
        unverified_header = jwt.get_unverified_header(credentials.credentials)

        # get JWK (dict with "kty", "n", "e", etc.)
        jwk_key = get_public_key(unverified_header["kid"])

        # decode
        payload = jwt.decode(
            credentials.credentials,
            jwk_key,
            algorithms=["RS256"],
            audience=config.API_AUDIENCE,
            issuer=f"https://{config.DOMAIN}/",
        )
        return UserClaims(
                sub=payload["sub"], permissions=payload.get("permissions", [])
            )
    except (
        ExpiredSignatureError,
        JWTError,
        JWTClaimsError,
        JWSError,
    ) as error:
        raise HTTPException(status_code=401, detail=str(error))

def process_login_token(token_response:str):

    access_token = token_response["access_token"]
    id_token = token_response["id_token"]
    user_info = jwt.decode(token = id_token,
                           key=None,
                           algorithms=["RS256"],
                           options={"verify_signature": False, "verify_aud":False})

    name = user_info["name"]
    email = user_info["email"]
    sub = user_info["sub"]

    if not email or not sub:
        raise HTTPException(status_code=400, detail="Missing user identity")
    
    login_id = str(uuid.uuid4())
    PENDING_LOGINS[login_id] ={
        "email":email,
        "name":name,
        "sub":sub,
        "tokens": token_response,
        "created_at": datetime.utcnow()
    }
    # print(PENDING_LOGINS)

    return login_id, id_token, access_token
## get user session 
## create user session

def check_session(login_id,
                    device_fp,
                    device_info,
                    response,
                    db):
    """
    - validate login_id and pending login
    - check for active sessions
    - if already active we reuse the same session
    - if not we check MAX_N and create new session accordingly
    """
    if login_id not in PENDING_LOGINS:
        raise HTTPException(status_code=400,
                            detail="Invalid or expired login")
    
    login_data = PENDING_LOGINS.pop(login_id)
    user_id = login_data["sub"]
    user_email = login_data["email"]

    # print(user_id, user_email)

    now = datetime.utcnow()

    # filter active sessions for the user
    active_sessions = get_active_sessions_for_user(db, user_email)

    # check active session for current device
    existing =(
        db.query(UserSession).filter_by(
            user_email = user_email,
            device_fingerprint = device_fp,
            device_info = device_info,
            is_active="true"
        ).first()
    )

    if existing and existing.expires_at > now:
        existing.last_active = now
        db.commit()

        response.set_cookie(
            key="session_id",
            value=existing.session_id,
            httponly=True,
            secure=False, #########
            samesite="lax",
            max_age=int((existing.expires_at - now).total_seconds())
        )
        return SessionResponse(success=True, 
                               session_id=existing.session_id, 
                               message="Session reused")
    
    # if new device
    # check for MAX_N
    # print(int(config.MAX_N), len(active_sessions))
    if (len(active_sessions) >= int(config.MAX_N)):
        sessions_list = [{"session_id": s.session_id, "device": s.device_fingerprint, "created_at": s.created_at.isoformat()} for s in active_sessions]
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail={"message":"Max devices reached", "sessions": sessions_list})
    # if allowed create new session
    session_id = str(uuid.uuid4())
    expires_at = now + timedelta(days=30)

    new_session = UserSession(
        session_id=session_id,
        user_id=user_id,
        user_email=user_email,
        device_fingerprint=device_fp,
        device_info=device_info,
        created_at=now,
        last_active=now,
        expires_at=expires_at,
        is_active="true"
    )
    db.add(new_session)
    db.commit()

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=False,   #################
        samesite="lax",
        max_age=int((expires_at - now).total_seconds())
    )

    return SessionResponse(
        success=True,
        session_id=session_id,
        message="New session created"
    )



def get_active_sessions_for_user(db: Session, user_email: str):
    now = datetime.utcnow()
    q = db.query(UserSession).filter(
        UserSession.user_email == user_email,
        UserSession.is_active == "true",
        UserSession.expires_at > now
    )
    # if you have closed_at field:
    if hasattr(UserSession, "closed_at"):
        q = q.filter(UserSession.closed_at == None)
    return q.all()

# print(process_login_token(token))