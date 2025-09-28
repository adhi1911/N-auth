from sqlalchemy import Column, String, DateTime, Integer, Boolean
from datetime import datetime

from .database import Base

class UserSession(Base):
    """Database table for storing user sessions"""
    __tablename__ = "user_sessions"
    

    session_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    user_email = Column(String, nullable=False)
    device_ip = Column(String, nullable=False)
    device_name = Column(String, nullable = False)
    device_info = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)
    last_active = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)

    access_token = Column(String, nullable=True)      # encrypted
    refresh_token = Column(String, nullable=True)     # encrypted

    # force logout
    closed_at = Column(DateTime, nullable=True)
    closed_reason = Column(String, nullable=True)  # "user_logout", "force_logout", "expired"
    force_logged_by = Column(String, nullable=True)
    force_logged_at = Column(DateTime, nullable=True)
    force_logout_message = Column(String, nullable=True)