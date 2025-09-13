import os 
import uuid 
import json 
import requests
from fastapi import FastAPI
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse, JSONResponse
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

#in-code modules
from core.config import Config
from core.schemas import UserClaims
from core.auth import validate_token
from core.database.database import Base,engine

app = FastAPI()
config = Config()


# middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind = engine)

@app.get("/login")
def back_login():
    return RedirectResponse(
        "https://dev-nlex2vytg8hlk2gz.us.auth0.com/authorize"
        "?response_type=code"
        f"&client_id={config.CLIENT_ID}"
        "&redirect_uri=http://localhost:8000/token"
        "&scope=offline_access openid profile email" 
        f"&audience={config.API_AUDIENCE}"
    )

@app.get("/token")
def get_access_token(code: str, response:Response):
    payload = (
        "grant_type=authorization_code"
        f"&client_id={config.CLIENT_ID}"
        f"&client_secret={config.CLIENT_SECRET}"
        f"&code={code}"
        f"&redirect_uri=http://localhost:8000/token"
    )
    headers = {"content-type": "application/x-www-form-urlencoded"}
    token_response = requests.post(
        "https://dev-nlex2vytg8hlk2gz.us.auth0.com/oauth/token", data=payload, headers=headers).json()
    
    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")

    return RedirectResponse(f"http://localhost:3000/callback?access_token={token_response['access_token']}")

@app.get("/orders")
def get_orders(user: UserClaims = Depends(validate_token)):
    return {"Status": "You got in buddy",
            "User": user.sub}

@app.get("/protected")
def protected_route(user_claims: UserClaims = Depends(validate_token)):
    """Example protected route that requires authentication"""
    return {
        "message": "You got in buddy!",
        "user_id": user_claims.sub,
        "permissions": user_claims.permissions
    }
