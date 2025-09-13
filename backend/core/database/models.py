from sqlalchemy import Column, String, DateTime, Integer
from datetime import datetime

from database import Base

class UserSession(Base):
    """Database table for storing user sessions"""
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    user_id = Column(String, index=True)  
    device_fingerprint = Column(String, index=True)
    device_info = Column(String)  
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    is_active = Column(String, default="true")