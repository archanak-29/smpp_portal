from sqlalchemy import Column, Integer, String, DateTime, func
from database.db_config import Base

class SenderIdentifier(Base):
    __tablename__ = "sender_identifier"

    sender_id = Column(Integer, autoincrement=True, primary_key=True)
    identifier_name = Column(String(255), unique=True)
    user_id = Column(String(50))
    created_on = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        return {
            "sender_id": self.sender_id,
            "identifier_name": self.identifier_name,
            "user_id": self.user_id,
            "created_on": self.created_on
        }