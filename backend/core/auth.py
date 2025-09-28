import requests
import uuid
from fastapi import Depends, HTTPException, status, Request
from typing import Annotated
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import  HTTPBearer
from jose import jws, jwt, ExpiredSignatureError, JWTError, JWSError
from jose.exceptions import JWTClaimsError
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func 

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


def logout_session(session_id: str, db:Session):
    session = db.query(UserSession).filter_by(
        session_id = session_id,
        is_active = True
    ).first()

    if session:
        session.is_active = False
        session.closed_at = datetime.utcnow()
        session.closed_reason = "user_logout"
        db.commit()

        return True
    return False


def forced_logout(device_ip , request, db):

    try:
        now = datetime.utcnow()


        sessions = db.query(UserSession).filter(
            UserSession.device_ip == device_ip, UserSession.is_active == True
        ).all()

        # print(sessions)

        if not sessions:
            return {
                "success": False,
                "message": "No active sessions found for this device",
                "affected_sessions": 0
            }
        
        for session in sessions:
            session.is_active = False
            session.closed_at = now
            session.closed_reason = "force_logout"
            session.force_logged_by = device_ip
            session.force_logged_at = now
            session.force_logout_message = f"Force logged out by {device_ip}"

        db.commit()

        return {
            "success": True,
            "message": f"Successfully force logged out {len(sessions)} sessions",
            "affected_sessions": len(sessions)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code= status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = f"Force logout failed: {str(e)}"
        )

## get user session 
## create user session



def check_session(  login_id,
                    device_ip,
                    device_info,
                    device_name,
                    response,
                    db):
    """
    - validate login_id and pending login
    - check for active sessions
    - if already active we reuse the same session
    - if not we check MAX_N and create new session accordingly
    """
    print("Inside check")
    if login_id not in PENDING_LOGINS:
        raise HTTPException(status_code=400,
                            detail="Invalid or expired login")
    
    login_data = PENDING_LOGINS.pop(login_id)
    user_id = login_data["sub"]
    user_email = login_data["email"]

    access_token = login_data["tokens"]["access_token"]
    refresh_token = login_data["tokens"]["refresh_token"]

    # print(user_id, user_email)

    now = datetime.utcnow()

    # # filter active sessions for the user
    device_list = get_active_devices_for_user(db, user_email)
    print(device_list)
    

    # check active session for current device
    existing =(
        db.query(UserSession).filter_by(
            user_email = user_email,
            device_ip = device_ip,
            device_info = device_info,
            device_name = device_name,
            is_active=True
        ).first()
    )

    if existing and existing.expires_at > now:
        existing.last_active = now
        # existing.access_token = access_token

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
    device_count = len(device_list)
    if device_ip not in [d["device_ip"] for d in device_list] and device_count >= int(config.MAX_N):
        raise HTTPException(
            status_code=403,
            detail={"message": "Max devices reached", "devices": device_list}
        )

    # if allowed create new session
    session_id = str(uuid.uuid4())
    expires_at = now + timedelta(days=30)

    new_session = UserSession(
        session_id=session_id,
        user_id=user_id,
        user_email=user_email,
        device_ip=device_ip,
        device_info=device_info,
        device_name = device_name,
        access_token=access_token,
        refresh_token=refresh_token,
        created_at=now,
        last_active=now,
        expires_at=expires_at,
        is_active=True
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

    print("Check out")

    return {"success": True, "session_id": session_id, "message": "New session created"}

def get_active_devices_for_user(db: Session, user_email: str):
    now = datetime.utcnow()

    sessions_per_device = (
        db.query(
            UserSession.device_ip,
            UserSession.device_name,
            func.count(UserSession.session_id).label("session_count")
        )
        .filter(
            UserSession.user_email == user_email,
            UserSession.is_active == True,
            UserSession.expires_at > now
        )
        .group_by(UserSession.device_ip,UserSession.device_name)
        .all()
    )
    
    # Convert to list of dicts for frontend
    device_list = [
        {
            "device_ip": d.device_ip,
            "device_name": d.device_name,
            "session_count": d.session_count
        } 
        for d in sessions_per_device
    ]
    
    return device_list

## authorization functions

def refresh_access_token(refresh_token: str):
    payload = {
        "grant_type":"refresh_token",
        "client_id": config.CLIENT_ID,
        "client_secret": config.CLIENT_SECRET,
        "refresh_token":refresh_token
    }

    res = requests.post(f"https://{config.DOMAIN}/oauth/token",data=payload)
    if res.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Refresh token expired or invalid")
    
    return res.json()

def get_current_user(request: Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Not authenticated")
    
    session = db.query(UserSession).filter_by(session_id=session_id, is_active=True).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session not found")
    
    try:
        jwt.decode(
            token = session.access_token,
            key = None,
            algorithms=["RS256"],
            issuer=f"https://{config.DOMAIN}/",
            options={"verify_signature":False,"verify_aud":False}
        )
    except jwt.ExpiredSignatureError:
        tokens = refresh_access_token(session.refresh_token)
        session.access_token = tokens["access_token"]
        if "refresh_token" in tokens:
            session.refresh_token = tokens["refresh_token"]

        db.commit()

    return {"user_id": session.user_id, "email": session.user_email}

# print(process_login_token(token))

