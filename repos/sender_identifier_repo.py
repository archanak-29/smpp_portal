
from sqlalchemy.orm import Session
from models.sender_identifier import SenderIdentifier
from sqlalchemy.exc import SQLAlchemyError
from typing import List

class SenderIdentifierRepo:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> SenderIdentifier:
        sv= SenderIdentifier()

        for k, v in kwargs.items():
            if hasattr(sv, k):
                setattr(sv, k, v)

        self.db.add(sv)
        self.db.commit()
        self.db.refresh(sv)
        return sv
    
    def find_by_user_id(self, user_id: str) -> List[SenderIdentifier]:
        try:
            return self.db.query(SenderIdentifier
            ).filter(SenderIdentifier.user_id == user_id).all()
        except (Exception, SQLAlchemyError) as e:
                self.db.rollback()


    def find_by_sender_name(self, sender_name: str):
        try:
            return self.db.query(SenderIdentifier).filter(
                SenderIdentifier.identifier_name == sender_name).first()
        except (Exception, SQLAlchemyError) as e:
                self.db.rollback()

    