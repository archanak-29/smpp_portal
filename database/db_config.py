# import os
# from sqlalchemy import create_engine
# from sqlalchemy.orm import declarative_base, sessionmaker
# import utils.constants as con

# Base = declarative_base()

# _ENGINE = None
# _SessionFactory = None

# def _get_mysql_url():
#     user = os.environ.get("DB_USER", con.DB_USER)
#     pwd = os.environ.get("DB_PWD", con.DB_PWD)
#     host = os.environ.get("DB_HOST", con.DB_HOST)
#     name = os.environ.get("DB_NAME", con.DB_NAME)
#     return f"mysql+pymysql://{user}:{pwd}@{host}/{name}"

# def _get_sqlite_url():
#     project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
#     sqlite_path = os.environ.get(
#         "SMPP_SQLITE_PATH",
#         os.path.join(project_root, "database", "smppdb.sqlite3")
#     )
#     return f"sqlite:///{sqlite_path}"

# def _is_sqlite_url(db_url: str) -> bool:
#     return db_url.startswith("sqlite://")

# def _is_mysql_url(db_url: str) -> bool:
#     return db_url.startswith("mysql+pymysql://") or db_url.startswith("mysql://")

# def _allow_sqlite_fallback() -> bool:
#     flag = os.environ.get("SMPP_ALLOW_SQLITE_FALLBACK", "1").strip().lower()
#     return flag in ("1", "true", "yes")

# def _create_engine(db_url: str):
#     if _is_sqlite_url(db_url):
#         return create_engine(
#             db_url,
#             connect_args={"check_same_thread": False},
#             pool_pre_ping=True
#         )
#     return create_engine(
#         db_url,
#         pool_size=40,          # max connections in pool
#         max_overflow=10,       # extra connections allowed
#         pool_recycle=3600,     # recycle stale connections
#         pool_pre_ping=True,    # auto check dead connections
#         echo=False
#     )

# def _init_engine():
#     global _ENGINE, _SessionFactory

#     if _ENGINE is not None:
#         return _ENGINE

#     db_url = os.environ.get("SMPP_DB_URL") or os.environ.get("DATABASE_URL") or _get_mysql_url()
#     use_sqlite = os.environ.get("SMPP_USE_SQLITE", "").strip().lower() in ("1", "true", "yes")
#     if use_sqlite:
#         db_url = _get_sqlite_url()

#     try:
#         _ENGINE = _create_engine(db_url)
#         _ENGINE.connect().close()
#     except Exception:
#         if (not use_sqlite) and _is_mysql_url(db_url) and _allow_sqlite_fallback():
#             sqlite_url = _get_sqlite_url()
#             _ENGINE = _create_engine(sqlite_url)
#             _ENGINE.connect().close()
#             print(
#                 "Warning: MySQL is unreachable; using SQLite fallback. "
#                 "Set SMPP_ALLOW_SQLITE_FALLBACK=0 to disable."
#             )
#         else:
#             raise

#     Base.metadata.create_all(_ENGINE)
#     _SessionFactory = sessionmaker(autoflush=False, bind=_ENGINE)
#     return _ENGINE

# def get_db_session():
#     if _SessionFactory is None:
#         _init_engine()
#     db = _SessionFactory()
#     try:
#         yield db
#     finally:
#         db.close()



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

SmppSession = sessionmaker(autoflush=False, bind=smpp_engine)
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