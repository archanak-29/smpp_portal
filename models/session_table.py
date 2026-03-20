from sqlalchemy import BigInteger, Column, Integer, String, Text,DateTime
from sqlalchemy.sql import func
from database.db_config import Base

class SessionTable(Base):
    __tablename__ = "session"

    session_id = Column(BigInteger, primary_key=True, autoincrement=True)
    session_key = Column(String(50), nullable=False)
    user_id = Column(String(50), nullable=False, unique=True)
    ip_address = Column(String(20), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True))
    
    def to_dict(self):
        return {
            "session_id": self.session_id,
            "session_key": self.session_key,
            "user_id": self.user_id,
            "ip_address": self.ip_address,
            "date": self.date,
            "last_seen": self.last_seen,
        }

