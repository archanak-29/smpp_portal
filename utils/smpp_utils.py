from database.db_config import get_db_session
from repos.user_repo import UserRepo
from models.user import User
from repos.smpp_config_repo import SmppConfigRepo
from email_validator import validate_email, EmailNotValidError
from datetime import datetime
import utils.constants as const
from utils.http_utils import HttpUtils
from utils.command_utils import UserCommand
from repos.session_repo import SessionRepo
from repos.smpp_port_config_repo import SmppPortConfigRepo
from repos.sender_identifier_repo import SenderIdentifierRepo
import uuid

class SmppUtils:

    @staticmethod
    def _get_user_repo():
        db = next(get_db_session())
        return db, UserRepo(db)

    @staticmethod
    def get_sender_id_repo():
        db = next(get_db_session())
        return db, SenderIdentifierRepo(db)

    @staticmethod
    def validate_username_password(data):

        username = data.get("username")
        password = data.get("password")

        if not username:
            return  "User name required", False, None
        elif not password:
            return  "Password required", False, None

        db, user_repo = SmppUtils._get_user_repo()
        try:
            user = user_repo.get_user_by_user_name(username)

            if not user:
                return "Invalid Username", False, None
            elif not user.is_active:
                return  "Inactive user", False, None
            elif user.password != password:
                return "Invalid Password", False, None

            return "success", True, user
        finally:
            db.close()
    


    @staticmethod
    def change_password(user: User, new_password: str):
        updateData = {
            "password": new_password,
            "last_updated_on": datetime.now()
        }
        db, user_repo = SmppUtils._get_user_repo()
        try:
            user_repo.update_user(user.user_id, **updateData)
            return "success"
        finally:
            db.close()


    def is_valid_email(email):
        try:
            validate_email(email)
            return True
        except EmailNotValidError:
            return False
    
    def check_if_email_exists(email):

        db, user_repo = SmppUtils._get_user_repo()
        try:
            user = user_repo.find_by_email(email)
            if user != None:
                return True
            return False
        finally:
            db.close()

    @staticmethod
    def load_smtp_details():

        db = next(get_db_session())
        smppConfigRepo = SmppConfigRepo(db)
    
        smpp_config = smppConfigRepo.get_smpp_config_by_id(1)
        db.close()

        if smpp_config != None and smpp_config:
            const.smtp_server = smpp_config.smtp_server
            const.smtp_port = smpp_config.smtp_port
            const.smtp_email = smpp_config.smtp_email
            const.smtp_password = smpp_config.smtp_password

    
    def get_if_user_is_admin(user_id: str):
        db, user_repo = SmppUtils._get_user_repo()
        try:
            user = user_repo.find_by_user_id(user_id)

            if user == None or not user or not user.is_active:
                return "Invalid/Inactive user"
            elif not user.is_admin:
                return "Not allowed"
            else:
                return "success"
        finally:
            db.close()
    
    def get_all_smpp_clients():
        userList = []

        db = next(get_db_session())
        user_repo = UserRepo(db)
        try:

            users = user_repo.find_all_users()
            for user in users:
                if user.is_admin != None and user.is_admin:
                    continue
                userList.append(user)
        finally:
            db.close()
            return userList



    @staticmethod
    def add_user(command: UserCommand):

        db, user_repo = SmppUtils._get_user_repo()
        user_id = str(uuid.uuid4())
        try:
            user = {
                "user_id": user_id,
                "email": command.email,
                "user_name": command.username,
                "password": command.password,
                "actual_password": command.actualPassword,
                "is_active": True,
                "is_deleted": False,
                "sms_limit": command.smsLimit,
                "port": command.port,
                "is_bulk_upload_enabled": command.isBulkUploadEnabled,
                "msisdn": command.msisdn,
                "company_name": command.companyName,
                "last_updated_on": datetime.now(),
                "is_admin": False
            }

            sender = SmppUtils.add_sender_identifier(user_id, command.senderName)
            return user_repo.create(**user)

        finally:
            db.close()

    @staticmethod
    def add_sender_identifier(user_id: str, sender_name: str):
        db = next(get_db_session())
        sender_id_repo = SenderIdentifierRepo(db)

        sender_info = {
            "user_id": user_id,
            "identifier_name": sender_name,
        }

        return sender_id_repo.create(**sender_info)

    @staticmethod
    def add_sender_id(user_id: str, sender_id: str):
        db, user_repo = SmppUtils._get_user_repo()
        try:
            user = user_repo.find_by_user_id(user_id)

            if user == None:
                return "Invalid user selected"
            
            SmppUtils.add_sender_identifier(user_id, sender_id)

            return "success"
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


    @staticmethod
    def activate_or_deactivate_user(user_id: str, is_active: bool, reason: str):
        db, user_repo = SmppUtils._get_user_repo()
        try:
            user = user_repo.find_by_user_id(user_id)

            if user == None:
                return "Invalid user selected", False
            elif user.is_active == is_active:
                return "User already in the same state", False
            
            updatedData = {
                "is_active": is_active,
                "last_updated_on": datetime.now(),
                "last_update_reason": reason
            }

            user_repo.update_user(user_id, **updatedData)

            return "success", True
        finally:
            db.close()


    def get_all_smpp_ports():
        db = next(get_db_session())
        port_config_repo = SmppPortConfigRepo(db)
        
        all_ports = port_config_repo.find_all_port_configs()
        db.close()
        return all_ports


    def send_single_a2p_sms(sender_id, receiver, short_msg, user_id):

        db, user_repo = SmppUtils._get_user_repo()
        user = user_repo.find_by_user_id(user_id)
        if user == None:
            return "Invalid user"

        if not SmppUtils.valdate_sender_id(sender_id):
            return "Invalid sender name"
        
        to_mdns = [receiver]
        payload = {
            "shortMessage": short_msg,
            "fromMDN": sender_id,
            "toMdnList": to_mdns
        }

        resp = HttpUtils.post(const.smpp_a2p_sms_url, payload, None)
        if resp !=  None:
            return resp["status"] == "success"
        else:
            return "Unknown error"



    def valdate_sender_id(sender_id: str):
        db, sender_id_repo = SmppUtils.get_sender_id_repo()
        try:
            sender_identifier = sender_id_repo.find_by_sender_name(sender_name=sender_id)
            if sender_identifier == None:
                return False, None

            return True, sender_identifier.user_id
        finally:
            db.close()

    def update_user_sms_usage(user: User, user_repo: UserRepo, usage: int):
        updated_data = {
            "sms_last_sent_on": datetime.now(),
            "today_sms_count" : user.today_sms_count + usage
        }


    def get_sender_identifiers(user_id: str):
        db = next(get_db_session())
        sender_id_repo = SenderIdentifierRepo(db)

        sender_ids = sender_id_repo.find_by_user_id(user_id)
        db.close()
        return sender_ids
