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
from core.auth import get_current_user, process_login_token, validate_token, check_session, logout_session
from core.database.database import Base , engine, get_db
from core.database.models import UserSession

app = FastAPI()
config = Config()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://192.168.0.101:3000",
    "http://192.168.0.101:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

Base.metadata.create_all(bind = engine)

@app.get("/")
def root():
    return "N-auth"

@app.get("/login")
def back_login():
    print("In login")
    return RedirectResponse(
        "https://dev-nlex2vytg8hlk2gz.us.auth0.com/authorize"
        "?response_type=code"
        f"&client_id={config.CLIENT_ID}"
        f"&redirect_uri={config.BACKEND_URI}/token"
        "&scope=offline_access openid profile email" 
        f"&audience={config.API_AUDIENCE}"
    )

@app.get("/token")
def get_access_token(code: str, response:Response):
    print("In token")
    payload = (
        "grant_type=authorization_code"
        f"&client_id={config.CLIENT_ID}"
        f"&client_secret={config.CLIENT_SECRET}"
        f"&code={code}"
        "&scope=offline_access openid profile email"
        f"&redirect_uri={config.BACKEND_URI}/token"
    )
    headers = {"content-type": "application/x-www-form-urlencoded"}
    token_response = requests.post(
        "https://dev-nlex2vytg8hlk2gz.us.auth0.com/oauth/token", data=payload, headers=headers).json()
    
    
    login_id, _,_ = process_login_token(token_response)

    print("Leaving token")
    return RedirectResponse(f"{config.FRONTEND_URI}/callback?login_id={login_id}")
    # return token_response


@app.post("/logout")
async def logout(request: Request, db:Session = Depends(get_db)):
    session_id = request.cookies.get("session_id")
    if not session_id:
        return HTTPException(
            status_code= status.HTTP_401_UNAUTHORIZED,
            detail = "No session found"
        )
    success = logout_session(session_id, db)
    if success:
        response = JSONResponse({"success":True})
        response.delete_cookie(key="session_id")
        return response 
    
    raise HTTPException(
        status_code= status.HTTP_400_BAD_REQUEST,
        detail = "LogoutFailed"
    )

@app.get("/session/validate")
def validate_session(request:Request, db: Session = Depends(get_db)):
    print("session validation")
    session_id = request.cookies.get("session_id")
    # print(session_id)
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="No session cookie")
    
    session = db.query(UserSession).filter_by(
        session_id=session_id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session not found")
    
    # print(session)
    now = datetime.utcnow()
    if not session.is_active or session.expires_at <= now:
        session.is_active = "false"
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Session expired or inactive")
    
    session.last_active = now
    db.commit()
    print("Sesssion validation out")
    return {"Success": True, "session_id":session.session_id,"user_id":session.user_id}


@app.post("/session/check")
def post_check_session(payload: LoginRequest, request:Request,response: Response, db: Session = Depends(get_db)):
    login_id = payload.login_id
    device_info = payload.device_info
    device_name = payload.device_name
    device_ip = request.client.host

    check_session(login_id, device_ip, device_info, device_name,response,db)

@app.get("/protected")
def protected_route(user_claims: UserClaims = Depends(validate_token)):
    """Example protected route that requires authentication"""
    return {
        "message": "You got in buddy!",
        "user_id": user_claims.sub,
        "permissions": user_claims.permissions
    }


@app.get("/profile")
def get_profile(
    current_user=Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    return {
        "message": "Protected route",
        "user": current_user
    }