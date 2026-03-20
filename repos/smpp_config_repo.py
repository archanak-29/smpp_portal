from sqlalchemy.orm import Session

from models.smpp_config import SmppConfig
from typing import Optional


class SmppConfigRepo:

    def __init__(self, db: Session):
        self.db = db

    def get_smpp_config_by_id(self, id: int) -> Optional[SmppConfig]:
        return self.db.query(SmppConfig).filter(SmppConfig.config_id == id).first()