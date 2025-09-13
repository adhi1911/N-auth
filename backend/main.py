import os 
import uuid 
import json 
import jwt
import requests
from fastapi import FastAPI, status
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

#in-code modules
from core.config import Config
from core.schemas import LoginRequest, SessionResponse, UserClaims
from core.auth import process_login_token, validate_token, check_session
from core.database.database import Base , engine, get_db
from core.database.models import UserSession

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
    
    
    login_id, _,_ = process_login_token(token_response)


    return RedirectResponse(f"http://localhost:3000/callback?login_id={login_id}")

@app.get("/session/validate")
def validate_session(request:Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="No session cookie")
    
    session = db.query(UserSession).filter_by(
        session_id=session_id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session not found")
    
    now = datetime.utcnow()
    if not session.is_active or session.expires_at <= now:
        session.is_active = "false"
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session expired or inactive")
    
    session.last_active = now
    db.commit()

    return {"Success": True, "session_id":session.session_id,"user_id":session.user_id}


@app.post("/session/check")
def post_check_session(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    login_id = payload.login_id
    device_fp = payload.device_fingerprint
    device_info = payload.device_info

    check_session(login_id, device_fp, device_info,response,db)

@app.get("/protected")
def protected_route(user_claims: UserClaims = Depends(validate_token)):
    """Example protected route that requires authentication"""
    return {
        "message": "You got in buddy!",
        "user_id": user_claims.sub,
        "permissions": user_claims.permissions
    }
