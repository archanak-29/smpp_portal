from sqlalchemy import Column, Integer, DateTime, Boolean, String
from database.db_config import Base


class SmppPortConfig(Base):
    __tablename__ = 'smpp_port_config'

    config_id = Column(Integer, autoincrement=True, primary_key=True)
    created_on = Column(DateTime)
    is_active = Column(Boolean, default=False)
    host = Column(String(50))
    password = Column(String(50))
    system_id = Column(String(50))
    is_read_only_sms = Column(Boolean, default=False)
    port = Column(Integer)

    def to_dict(self):
        return {
            "config_id": self.config_id,
            "created_on": self.created_on,
            "is_active": self.is_active,
            "host": self.host,
            "password": self.password,
            "system_id": self.system_id,
            "is_read_only_sms": self.is_read_only_sms,
            "port": self.port
        }