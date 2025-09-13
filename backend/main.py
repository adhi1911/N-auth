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
from core.models import UserClaims
from core.auth import validate_token

app = FastAPI()
config = Config()


# middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[""], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.route("/login")
def login():
    return RedirectResponse(
        "https://dev-nlex2vytg8hlk2gz.us.auth0.com/authorize"
        "?response_type=code"
        f"&client_id={config.CLIENT_ID}"
        "&redirect_uri=http://localhost:8000/token"
        "&scope=offline_access openid profile email" 
        f"&audience={config.API_AUDIENCE}"
    )

@app.get("/token")
def get_access_token(code: str):
    payload = (
        "grant_type=authorization_code"
        f"&client_id={config.CLIENT_ID}"
        f"&client_secret={config.CLIENT_SECRET}"
        f"&code={code}"
        f"&redirect_uri=http://localhost:8000/token"
    )
    headers = {"content-type": "application/x-www-form-urlencoded"}
    response = requests.post(
        "https://dev-nlex2vytg8hlk2gz.us.auth0.com/oauth/token", data=payload, headers=headers)
    return response.json()

@app.get("/orders")
def get_orders(user: UserClaims = Depends(validate_token)):
    return {"Status": "You got in buddy",
            "User": user.sub}

@app.get("/protected")
def protected_route(user_claims: UserClaims = Depends(validate_token) ):
    return user_claims