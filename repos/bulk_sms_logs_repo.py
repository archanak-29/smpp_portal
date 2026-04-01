from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models.bulk_sms_logs import BulkSmsLogs
from typing import List


class BulkSmsLogsRepo:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> BulkSmsLogs:
        sv= BulkSmsLogs()

        for k, v in kwargs.items():
            if hasattr(sv, k):
                setattr(sv, k, v)

        self.db.add(sv)
        self.db.commit()
        self.db.refresh(sv)
        return sv
    
    def find_by_block_id(self, block_id: str) -> List[BulkSmsLogs]:
        try:
            return self.db.query(BulkSmsLogs
            ).filter(BulkSmsLogs.block_id == block_id).all()
        except (Exception, SQLAlchemyError) as e:
                self.db.rollback()
