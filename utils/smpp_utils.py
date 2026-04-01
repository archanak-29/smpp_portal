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
from utils.email_utils import EmailUtils
import uuid
from typing import List


class SmppUtils:

    email_utils_obj = None

    @staticmethod
    def _get_user_repo():
        db = next(get_db_session())
        return db, UserRepo(db)

    @staticmethod
    def get_sender_id_repo():
        db = next(get_db_session())
        return db, SenderIdentifierRepo(db)


    @staticmethod
    def get_email_obj():

        if SmppUtils.email_utils_obj == None:
            SmppUtils.email_utils_obj = EmailUtils(
            smtp_server=const.smtp_server,
            smtp_port=const.smtp_port,
            username=const.smtp_email,
            password=const.smtp_password
            )
        return SmppUtils.email_utils_obj

    @staticmethod
    def get_users_count():
        db, user_repo = SmppUtils._get_user_repo()
        try:
            total_count = user_repo.count_all_users()
            active_count = user_repo.count_users_by_state(True)
            return total_count, active_count
        finally:
            db.close()


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
    def get_user_by_id(user_id: str):
        db, user_repo = SmppUtils._get_user_repo()
        user = user_repo.find_by_user_id(user_id)

        if user == None:
            return "Invalid user", []
        
        vo = []
        vo.append(user.to_dict())
        return "success", vo


    @staticmethod
    def add_user(command: UserCommand):

        if not SmppUtils.validate_smpp_user_and_port(command.portUsername, command.port):
            return "Invalid Smpp user details entered"

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
                "is_admin": False,
                "port_username": command.portUsername
            }

            SmppUtils.add_sender_identifier(user_id, command.senderName)
            user = user_repo.create(**user)

            SmppUtils.send_user_creation_email(command.email, command.username, command.actualPassword)
            return "success"

        finally:
            db.close()

    def validate_smpp_user_and_port(username: str, port: int):
        db = next(get_db_session())
        port_config_repo = SmppPortConfigRepo(db)

        port_config = port_config_repo.find_by_user_name_and_port(username, port)
        if port_config == None:
            return False
        return True

    @staticmethod
    def add_sender_identifier(user_id: str, sender_name: str):
        db = next(get_db_session())
        sender_id_repo = SenderIdentifierRepo(db)

        sender_id = sender_id_repo.find_by_sender_name(sender_name)
        if sender_id != None:
            return "Sender name already exists, please enter another one."

        sender_info = {
            "user_id": user_id,
            "identifier_name": sender_name,
        }

        sender_id_repo.create(**sender_info)
        db.close()
        return "success"

    @staticmethod
    def delete_sender_ids_on_user_deletion(user_id: str):
        db = next(get_db_session())
        sender_id_repo = SenderIdentifierRepo(db)

        print(F"Deleting Sender Id's")
        sender_id_repo.delete_by_user_id(user_id)


    @staticmethod
    def add_sender_id(user_id: str, sender_id: str):
        db, user_repo = SmppUtils._get_user_repo()
        try:
            user = user_repo.find_by_user_id(user_id)

            if user == None:
                return "Invalid user selected"
            
            return SmppUtils.add_sender_identifier(user_id, sender_id)

        finally:
            db.close()

    @staticmethod
    def delete_sender_identidier(sender_name: str):
        db = next(get_db_session())
        sender_id_repo = SenderIdentifierRepo(db)

        sender_id = sender_id_repo.find_by_sender_name(sender_name)
        if sender_id == None:
            return "Invalid sender name"
        count = sender_id_repo.delete_by_sender_name(sender_name=sender_name)
        print(F"Deleted count : {count}")
        return "success"


    @staticmethod
    def add_smpp_user(command: UserCommand):
        
        db = next(get_db_session())
        port_config_repo = SmppPortConfigRepo(db)

        port_config = port_config_repo.find_by_user_name(command.username)
        if port_config != None:
            return "User already exists with this username, try another one."

        port_config_data = {
            "created_on": datetime.now(),
            "is_active": True,
            "host": "smpp-server",
            "is_read_only_sms": command.isReadOnlySms,
            "system_id": command.username,
            "password": command.password,
            "port": command.port
        }

        port_config_repo.create(**port_config_data)
        db.close()
        return "success"

    
    @staticmethod
    def delete_smpp_user(username: str):
        db = next(get_db_session())
        port_config_repo = SmppPortConfigRepo(db)

        port_config = port_config_repo.find_by_user_name(username)
        if port_config == None:
            return "Invalid Smpp User"
        
        port_config_repo.delete_by_user_name(username)
        return "success"
        

        


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


    @staticmethod
    def update_bulk_sms_enabled_state(user_id:str, bulk_status:bool):
        db, user_repo = SmppUtils._get_user_repo()
        try:
            user = user_repo.find_by_user_id(user_id)

            if user == None:
                return "Invalid user selected"
            
            updatedData = {
                "is_bulk_upload_enabled": bulk_status,
                "last_updated_on": datetime.now(),
                "last_update_reason": "Bulk status updated to " + str(bulk_status)
            }

            user_repo.update_user(user_id, **updatedData)
            return "success"

        finally:
            db.close()


    @staticmethod
    def update_sms_limit(user_id:str, sms_limit:int):
        db, user_repo = SmppUtils._get_user_repo()
        try:
            user = user_repo.find_by_user_id(user_id)

            if user == None:
                return "Invalid user selected"
            
            updatedData = {
                "sms_limit": sms_limit,
                "last_updated_on": datetime.now(),
                "last_update_reason": "Updating sms limit to " + str(sms_limit)
            }

            user_repo.update_user(user_id, **updatedData)
            return "success"

        finally:
            db.close()

    @staticmethod
    def delete_user(user_id: str, reason: str):

        SmppUtils.delete_sender_ids_on_user_deletion(user_id)

        db, user_repo = SmppUtils._get_user_repo()
        try:
            user = user_repo.find_by_user_id(user_id)

            if user == None:
                return "Invalid user selected", False
            elif user.is_active == True:
                return "User is in active state", False

            updatedData = {
                "is_deleted": True,
                "last_updated_on": datetime.now(),
                "last_update_reason": reason
            }
            print(F"Deleting user {user.user_name}")
            user = user_repo.update_user(user_id, **updatedData)
            return "success", True

        finally:
            db.close()


    def get_all_smpp_ports():
        db = next(get_db_session())
        port_config_repo = SmppPortConfigRepo(db)
        
        all_ports = port_config_repo.find_all_port_configs()
        db.close()
        return all_ports


    def send_single_a2p_sms(sender_id, receiver:str, short_msg, user_id):

        db, user_repo = SmppUtils._get_user_repo()
        user = user_repo.find_by_user_id(user_id)
        if user == None:
            return "Invalid user"
        elif user.sms_limit == user.today_sms_count:
            return "Sms limit exceeded for today. Please come back tomorrow"
        
        is_valid, user_id = SmppUtils.valdate_sender_id(sender_id)
        if not is_valid:
            return "Invalid sender name"


        if not SmppUtils.valdate_sender_id(sender_id):
            return "Invalid sender name"
        
        to_mdns = []
        to_mdns.append(receiver)
        payload = {
            "shortMessage": short_msg,
            "fromMDN": sender_id,
            "toMdnList": to_mdns
        }

        print(F"Sending Submit SM API: {const.subit_sm_url}")
        print(F"Payload : {payload}")
        
        resp = HttpUtils.post(const.subit_sm_url, payload=payload, headers=const.json_content_header)
        if resp !=  None:
            SmppUtils.update_used_sms_count(user, user_repo, 1)
            return resp["status"]
        else:
            return "Unknown error"



    def send_bulk_sms(sender_name: str, msisdns: List, message: str, user:User):

        db, user_repo = SmppUtils._get_user_repo()

        is_valid, user_id = SmppUtils.valdate_sender_id(sender_name)
        if not is_valid:
            return "Invalid sender name"
        try:
            payload = {
                "shortMessage": message,
                "fromMDN": sender_name,
                "toMdnList": msisdns
            }

            resp = HttpUtils.post(const.subit_sm_url, payload, None)
            if resp !=  None:
                SmppUtils.update_used_sms_count(user, user_repo, len(msisdns))
                return resp["status"] == "success"
            else:
                return "Unknown error"
        finally:
            db.close()

    def update_used_sms_count(user:User, user_repo:UserRepo, sms_count:int):
        updated_user = {}
        if user.today_sms_count == None:
            updated_user = {
                "today_sms_count": sms_count,
                "sms_last_sent_on": datetime.now()
            }
        else:
            updated_user = {
                "today_sms_count": user.today_sms_count + sms_count,
                "last_updated_on": datetime.now(),
                "last_update_reason": "Sms usage updated" 
            }

        user = user_repo.update_user(user.user_id, **updated_user)
        SmppUtils.send_email_alert_for_sms_limit_reached(user.email, user.user_name)


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


    def get_active_smpp_server_sessions():
        resp = HttpUtils.get(const.active_session_api, None, None)

        if resp == None:
            return "Unknown error"
        respList = []
        respList = resp["respList"]
        return respList







# ------------- Email Bodies ------------------
    @staticmethod
    def send_email_alert_for_sms_limit_reached(to_email: str, user_name: str):

        current_date = datetime.now().strftime("%Y-%m-%d")

        body = f"""Dear {user_name},

        Your SMS limit for {current_date} has been reached. You will be able to resume sending SMS from tomorrow.

        If you have any questions, please contact your administrator.

        Thank you,
        Intelvision Services
        """

        SmppUtils.get_email_obj().send_email_async(
            to_email,
            "Alert: SMS Limit Reached!",
            body
        )

    @staticmethod
    def send_user_creation_email(to_email: str, user_name: str, password: str):

        body = f"""Dear {user_name},

        Welcome to Intelvision Services!

        Your SMPP account has been successfully created. Please find your login credentials below:

        Username: {user_name}
        Password: {password}

        URL: {const.dashboard_url}

        You can use the above credentials to log in and start using our SMPP service.

        For security reasons, we strongly recommend that you change your password after your first login and keep your credentials confidential.

        If you face any issues or have any questions, please feel free to contact your administrator or support team.

        We look forward to serving you.

        Thank you,
        Intelvision Services
        """

        SmppUtils.get_email_obj().send_email_async(
            to_email,
            "Welcome! Your SMPP Account is Ready",
            body
        )
    
    
