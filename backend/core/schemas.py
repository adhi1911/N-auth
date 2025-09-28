from pydantic import BaseModel
from typing import Optional

# Updated UserClaims model
class UserClaims(BaseModel):
    sub: str
    permissions: list[str]

class LoginRequest(BaseModel):
    login_id : str
    device_info: Optional[str] = None
    device_name: Optional[str] = None

class CheckSessionRequest(BaseModel):
    login_id: str
    device_name: str | None = None
    device_info: str | None = None

class SessionResponse(BaseModel):
    success: bool
    session_id: str
    message: str