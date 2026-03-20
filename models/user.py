from sqlalchemy import Column, Integer, String, Text,DateTime , Boolean
from sqlalchemy.sql import func
from database.db_config import Base

class User(Base):
    __tablename__ = "user"

    user_id = Column(String(50), primary_key=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    password = Column(String(255), nullable=False)
    actual_password = Column(String(20))
    user_name = Column(String(50), nullable=False)
    full_name = Column(String(50), nullable=True)
    email = Column(String(50), nullable=False, unique=True)
    invalid_attempts = Column(Integer, default=3)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    last_updated_on = Column(DateTime(timezone=True))
    sender_name = Column((String(250)), nullable=False)
    company_name = Column(String(200))
    last_login = Column(DateTime(timezone=True))
    port = Column(Integer)
    sms_limit = Column(Integer)
    is_bulk_upload_enabled = Column(Boolean, default=False)
    is_admin = Column(Boolean)
    msisdn = Column(String(20))
    a2p_sms_url = Column(String(255))
    last_update_reason = Column(String(500))
    today_sms_count = Column(Integer)
    sms_last_sent_on = Column(DateTime)


    def to_dict(self):
        return {
            "user_id": self.user_id,
            "is_active": self.is_active,
            "is_deleted": self.is_deleted,
            "user_name": self.user_name,
            "email": self.email,
            "created_on": self.created_on,
            "invalid_attempts": self.invalid_attempts,
            "full_name": self.full_name,
            "sender_name": self.sender_name,
            "port": self.port,
            "sms_limit": self.sms_limit,
            "msisdn": self.msisdn,
            "is_bulk_upload_enabled": self.is_bulk_upload_enabled,
            "is_admin": self.is_admin,
            "a2p_sms_url": self.a2p_sms_url,
            "today_sms_count": self.today_sms_count,
            "sms_last_sent_on": self.sms_last_sent_on
        }

