from sqlalchemy import Column, Integer, String, Text,DateTime , Boolean, BigInteger
from sqlalchemy.sql import func
from database.db_config import Base

class BulkSmsBlock(Base):
    __tablename__ = "bulk_sms_block"

    block_id = Column(String(20), autoincrement=False, primary_key=True)
    bulk_status = Column(String(20))
    created_on = Column(DateTime)
    last_updated_on = Column(DateTime)
    message = Column(String(255))
    sender_id = Column(String(20))

    def to_dict(self):
        return {
            "block_id": self.block_id,
            "bulk_status": self.bulk_status,
            "created_on": self.created_on,
            "last_updated_on": self.last_updated_on,
            "message": self.message,
            "sender_id": self.sender_id
        }