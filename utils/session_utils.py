import uuid
from repos.session_repo import SessionRepo
from database.db_config import get_db_session
from datetime import datetime, timezone, timedelta
from repos.user_repo import UserRepo

class SessionUtils:
    
    def create_session(user_role: str, ip_address: str, is_admin: bool, user_id:str):
        session_key = str(uuid.uuid4())

        session_info = {
            "session_key": session_key,
            "user_id": user_id,
            "ip_address": ip_address,
            "date": datetime.now(),
            "last_seen": datetime.now(),
            "is_admin": is_admin
        }
        print(F"Creating session >> {session_key}")
        return SessionUtils.insert_session(session_info)

    def insert_session(session_data):
        
        db = next(get_db_session())
        session_repo = SessionRepo(db)
        session = session_repo.create(**session_data)
        db.close()
        return session

    def validate_session(session_id):

        db = next(get_db_session())
        try:
            repo = SessionRepo(db)
            session = repo.get_by_session_key(session_id)

            if not session:
                return "Invalid Session", False, None

            session_date = session.date.replace(tzinfo=timezone.utc)

            if datetime.now(timezone.utc) - session_date > timedelta(hours=1):
                return "Session expired", False, None

            return "success", True, session.user_id
        finally:
            db.close()

    def validate_admin_session(session_id):

        db = next(get_db_session())
        try:
            repo = SessionRepo(db)
            session = repo.get_by_session_key(session_id)

            if not session:
                return "Invalid Session, log in again", False

            session_date = session.date.replace(tzinfo=timezone.utc)

            if datetime.now(timezone.utc) - session_date > timedelta(hours=1):
                return "Session expired", False

            userRepo = UserRepo(db)
            user = userRepo.find_by_user_id(session.user_id)
            if not user or not user.is_active:
                return "Invalid user", False
            elif not user.is_admin:
                return "Not allowed", False
            return "success", True
        finally:
            db.close()


    @staticmethod
    def check_if_bulk_sms_allowed(session_id: str):

        db = next(get_db_session())
        try:
            session_repo = SessionRepo(db)
            session = session_repo.get_by_session_key(session_id)
            if not session:
                return "Invalid Session", False

            user_repo = UserRepo(db)
            user = user_repo.find_by_user_id(session.user_id)
            if not user or not user.is_active:
                return "Invalid/Inactive user", False
            elif user.is_bulk_upload_enabled == None or not user.is_bulk_upload_enabled:
                return "Bulk upload disabled", False

            return "success", True
        finally:
            db.close()