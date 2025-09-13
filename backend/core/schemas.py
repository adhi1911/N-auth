from pydantic import BaseModel
from typing import Optional

# Updated UserClaims model
class UserClaims(BaseModel):
    sub: str
    permissions: list[str]

class LoginRequest(BaseModel):
    login_id : str
    device_fingerprint: str
    device_info: Optional[str] = None

class CheckSessionRequest(BaseModel):
    login_id: str
    device_fingerprint: str
    device_info: str | None = None

class SessionResponse(BaseModel):
    success: bool
    session_id: str
    message: str