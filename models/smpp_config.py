from sqlalchemy import Column, Integer, String, DateTime , Boolean
from sqlalchemy.sql import func
from database.db_config import Base

class SmppConfig(Base):
    __tablename__ = "smpp_config"

    config_id = Column(Integer, primary_key=True, autoincrement=True)
    is_active = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    smtp_server = Column(String(50))
    smtp_port = Column(Integer)
    smtp_email = Column(String(50))
    smtp_password = Column(String(20))
    bulk_sms_limit = Column(Integer)
    daily_sms_limit = Column(Integer)
    created_on = Column(DateTime(timezone=True), server_default=func.now())
    last_updated_on = Column(DateTime(timezone=True))
