from database.db_config import Base
from sqlalchemy import Column, String, DateTime, BigInteger

class BulkSmsLogs(Base):

    __tablename__ = "bulk_sms_logs"

    sms_id = Column(BigInteger, autoincrement=True, primary_key=True)
    block_id = Column(String(30))
    created_on = Column(DateTime)
    failure_cause = Column(String(100))
    receiver = Column(String(20))
    sms_reference_id = Column(String(20))
    status = Column(String(20))

    def to_dict(self):
        return {
            "sms_id": self.sms_id,
            "block_id": self.block_id,
            "created_on": self.created_on,
            "failure_cause": self.failure_cause,
            "receiver": self.receiver,
            "sms_reference_id": self.sms_reference_id,
            "status": self.status
        }