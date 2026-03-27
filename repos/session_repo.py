from sqlalchemy.orm import Session
from models.session_table import SessionTable

class SessionRepo:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> SessionTable:
        sv= SessionTable()

        for k, v in kwargs.items():
            if hasattr(sv, k):
                setattr(sv, k, v)

        self.db.add(sv)
        self.db.commit()
        self.db.refresh(sv)
        return sv

    def get_by_session_key(self, session_key: str) -> SessionTable:
        return self.db.query(SessionTable).filter(SessionTable.session_key == session_key).first()
    
    def delete_by_session_key(self, session_key: str):
        return self.db.query(SessionTable).filter(SessionTable.session_key == session_key).delete()
    
