from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models.smpp_port_config import SmppPortConfig

class SmppPortConfigRepo:
    def __init__(self, db: Session):
        self.db = db

    def find_all_port_configs(self):
        try:
            return self.db.query(SmppPortConfig).filter(SmppPortConfig.is_active == True).all()
        except (Exception, SQLAlchemyError) as e:
            self.db.rollback()
            print(f"Error fetching users: {e}")
            return []