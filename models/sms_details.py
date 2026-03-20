from sqlalchemy import Column, String, LargeBinary, Boolean, DateTime, TIMESTAMP, func
from database.db_config import Base

class SmsDetails(Base):
    __tablename__ = "sms_details"

    sms_id = Column(String(20), primary_key=True, autoincrement=False)
    sender_number = Column(String(20))
    recipient_number = Column(String(20))
    raw_sms = Column(LargeBinary)
    delivery_status = Column(String(20))
    sent_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    received_at = Column(DateTime)
    last_updated_on = Column(DateTime)
    is_delivered = Column(Boolean)
    state = Column(String(20))
    sms_type = Column(String(20))
    lrn = Column(String(20))
    failure_cause = Column(String(20))
    failed_on = Column(DateTime)

    def to_dict(self):
        return {
            "sms_id" : self.sms_id,
            "sender": self.sender_number,
            "receiver": self.recipient_number,
            "delivery_status": self.delivery_status,
            "state":  self.state,
            "sms_sent_at": self.sent_at,
            "sms_received_at": self.received_at,
            "failure_cause": self.failure_cause
        }
