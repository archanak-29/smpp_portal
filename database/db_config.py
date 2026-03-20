from sqlalchemy import create_engine
import utils.constants as con
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
 
Base = declarative_base()
 
smpp_engine = create_engine(
    f"mysql+pymysql://{con.DB_USER}:{con.DB_PWD}@{con.DB_HOST}/{con.DB_NAME}",
    pool_size=40,          # max connections in pool
    max_overflow=10,       # extra connections allowed
    pool_recycle=3600,     # recycle stale connections
    pool_pre_ping=True,    # auto check dead connections
    echo=False
)

# smsc_engine = create_engine(
#     f"mysql+pymysql://{con.DB_USER}:Baiqu3lich@10.100.51.17/smsc",
#     pool_size=40,          # max connections in pool
#     max_overflow=10,       # extra connections allowed
#     pool_recycle=3600,     # recycle stale connections
#     pool_pre_ping=True,    # auto check dead connections
#     echo=False
# )

Base.metadata.create_all(smpp_engine)
# Base.metadata.create_all(smsc_engine)

SmppSession = sessionmaker(autoflush=True, bind=smpp_engine)
# SmscSession = sessionmaker(autoflush=False, bind=smsc_engine) 
 
def get_db_session():
    db = SmppSession()
    try:
        yield db
    finally:
        db.close()
 
# def get_smsc_session():
#     db = SmscSession()
#     try:
#         yield db
#     finally:
#         db.close()