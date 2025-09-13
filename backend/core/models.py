from pydantic import BaseModel
from typing import Optional

# Updated UserClaims model
class UserClaims(BaseModel):
    sub: str
    permissions: list[str]

# New models for our session management
class LoginRequest(BaseModel):
    device_fingerprint: str
    device_info: Optional[str] = None

class SessionResponse(BaseModel):
    success: bool
    session_id: str
    message: str