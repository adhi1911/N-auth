import requests
from fastapi import Depends, HTTPException
from typing import Annotated
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.security import  HTTPBearer
from jose import jws, jwt, ExpiredSignatureError, JWTError, JWSError
from jose.exceptions import JWTClaimsError


from .config import Config
from .schemas import UserClaims

config = Config()
security = HTTPBearer()


jwks_url = f"https://{config.DOMAIN}/.well-known/jwks.json"

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
