from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models.smpp_port_config import SmppPortConfig

class SmppPortConfigRepo:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> SmppPortConfig:
        sv= SmppPortConfig()

        for k, v in kwargs.items():
            if hasattr(sv, k):
                setattr(sv, k, v)

        self.db.add(sv)
        self.db.commit()
        self.db.refresh(sv)
        return sv

    def find_all_port_configs(self):
        try:
            return self.db.query(SmppPortConfig).filter(SmppPortConfig.is_active == True).all()
        except (Exception, SQLAlchemyError) as e:
            self.db.rollback()
            print(f"Error fetching users: {e}")
            return []
        
    def find_by_user_name(self, user_name: str) -> SmppPortConfig:
        try:
            return self.db.query(SmppPortConfig).filter(
                SmppPortConfig.system_id == user_name
            ).first()
        except (Exception, SQLAlchemyError) as e:
                self.db.rollback()

    def find_by_user_name_and_port(self, user_name: str, port: int) -> SmppPortConfig:
        try:
            return self.db.query(SmppPortConfig).filter(
                (SmppPortConfig.system_id == user_name) & (SmppPortConfig.port == port)
            ).first()
        except (Exception, SQLAlchemyError) as e:
                self.db.rollback()

    def delete_by_user_name(self, system_id: str):
        try:
            count = self.db.query(SmppPortConfig).filter(
                SmppPortConfig.system_id == system_id).delete()
            self.db.commit()
            return count
        except (Exception, SQLAlchemyError) as e:
                self.db.rollback()