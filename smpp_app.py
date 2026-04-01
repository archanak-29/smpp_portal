from flask import Flask, jsonify, request, render_template, session, redirect
import threading
from repos.user_repo import UserRepo
from database.db_config import get_db_session
from utils.session_utils import SessionUtils
from utils.smpp_utils import SmppUtils
from utils.command_utils import UserCommand
from datetime import datetime
import utils.constants as const
from utils.enums import SmsSendType



app = Flask(__name__)
app.secret_key = "smpp_secret_key"

@app.context_processor
def inject_admin_status():
    return dict(is_admin=session.get('is_admin', False))


# ----------------- Front-end API's -----------------
@app.route("/")
def login_page():
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():

    if "username" not in session:
        return redirect("/")

    if session.get("is_admin"):
        return render_template("dashboard.html", username=session["username"], active_page="dashboard")
    else:
        return render_template("client_dashboard.html", username=session["username"], active_page="dashboard", page_title="Dashboard")


@app.route("/admin")
def admin():

    if "username" not in session:
        return redirect("/")

    return render_template("admin.html", username=session["username"])

@app.route("/ports")
def ports():
    if "username" not in session:
        return redirect("/")
    return render_template("ports.html", username=session["username"], active_page="ports")

# @app.route("/users")
# def users():
#     if "username" not in session:
#         return redirect("/")
#     return render_template("users.html", username=session["username"])

@app.route("/users")
def users():
    if "username" not in session:
        return redirect("/")

    return render_template("users.html",username=session["username"],
        active_page="users",
        page_title="Users",
        session_id=""
    )

@app.route('/smpp-config')
def smpp_config():
    if "username" not in session:
        return redirect("/")
    return render_template("smpp_config.html", username=session["username"], active_page="smpp_config")



@app.route("/userinfo")
def user_info():
    if "username" not in session:
        return redirect("/")
    return render_template("clients.html", username=session["username"], active_page="user_info", page_title="User Information")

@app.route("/send-sms")
def send_sms():
    if "username" not in session:
        return redirect("/")
    return render_template("send_sms.html", username=session["username"], active_page="send_sms", page_title="Send SMS")

@app.route("/message-logs")
def message_logs():
    if "username" not in session:
        return redirect("/")
    return render_template("message_logs.html", username=session["username"], active_page="message_logs", page_title="Message Logs")

@app.route("/reports")
def reports():
    if "username" not in session:
        return redirect("/")
    return render_template("reports.html", username=session["username"], active_page="reports", page_title="Reports")

@app.route("/client-config")
def client_config():
    if "username" not in session:
        return redirect("/")
    return render_template("client_config.html", username=session["username"], active_page="client_config", page_title="SMPP Client Configuration")


# ------------ back-end API's ---------------

@app.post("/api/user_signin/")
def adminSignin():
    data = request.get_json()

    print("Login Command >>> ", data)

    status, is_valid, user = SmppUtils.validate_username_password(data)

    if not is_valid:
        return jsonify({"status": status}), 401
    
    is_admin = False
    if user.is_admin != None:
        is_admin = user.is_admin

    session["username"] = data.get("username")
    session["is_admin"] = is_admin
    
    session_table = SessionUtils.create_session("admin", "", is_admin, user.user_id)

    return jsonify({"status": "success", "SessionId": session_table.session_key, 
        "isAdmin": user.is_admin, "userId": user.user_id}), 200

@app.post("/api/logout/")
def logout():

    session.clear()
    request.headers.get('SESSIONID')

    return jsonify({"status":"success"}),200

@app.put("/api/change_password/")
def changePassword():

    status, is_valid, user_id = SessionUtils.validate_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    data = request.get_json()

    if not data.get("newPassword") or not data.get("actualPassword"):
        return jsonify({"status": "New password is required"}), 200

    status, is_valid, user = SmppUtils.validate_username_password(data)

    if not is_valid: 
        return jsonify({"status": status}), 200

    if user_id != user.user_id:
        return jsonify({"status", "Not allowed"}), 200
    
    status = SmppUtils.change_password(user, data.get("newPassword"))

    return jsonify({"status": status}), 200


@app.post("/api/add_user/")
def addUser():

    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
        
    command = UserCommand(**request.json)

    if not command.email or not SmppUtils.is_valid_email(command.email):
        return jsonify({"status": "Invalid email/Email is required"}), 200
    elif not command.senderName:
        return jsonify({"status": "Sender id is required"}), 200
    elif not command.smsLimit or command.smsLimit == 0:
        return jsonify({"status": "Sms limit is required"}), 200
    elif not command.port or command.port == 0:
        return jsonify({"status": "Port number is required"}), 200
    elif not command.username:
        return jsonify({"status": "Username is required"}), 200
    elif not command.password or not command.actualPassword:
        return jsonify({"status": "Password is required"}), 200
    elif not command.portUsername:
        return jsonify({"status": "Username of port is required"}), 200

    if SmppUtils.check_if_email_exists(command.email):
        return jsonify({"status": "Email already exists"}), 200
    
    status = SmppUtils.add_user(command)
    return jsonify({"status": status}), 200


@app.put("/api/active_deactive_user/")
def activeDeactiveUser():

    data = request.get_json()
    user_id = data.get("userId")
    is_active = data.get("status")
    reason = data.get("reason")

    if not user_id:
        return jsonify({"status": "User id required"}), 200

    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    status, is_valid = SmppUtils.activate_or_deactivate_user(user_id, is_active, reason)

    return jsonify({"status": status}), 200


@app.get("/api/all_smpp_clients/")
def getAllSmppClientUsers():

    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200

    userList = SmppUtils.get_all_smpp_clients()
    resp = [vo.to_dict() for vo in userList]
    return jsonify({"status": "success", "smppClients": resp})


@app.get("/api/user_by_id/<user_id>")
def getUserByUserId(user_id):

    status, is_valid, userId = SessionUtils.validate_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    status, vo = SmppUtils.get_user_by_id(user_id)
    return jsonify({"status": "success", "userVo": vo}), 200


@app.post("/api/add_sender_id")
def addSenderId():

    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    data = request.get_json()

    if len(data.get("senderId")) > 11:
        return jsonify({"status": "Sender name must not exceed 11 characters."}), 200

    status = SmppUtils.add_sender_id(data.get("userId"), data.get("senderId"))

    return jsonify({"status": status}), 200


@app.delete("/api/delete_sender_id/<sender_name>")
def deleteSenderId(sender_name):

    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    status = SmppUtils.delete_sender_identidier(sender_name)
    return jsonify({"status": status}), 200


@app.post("/api/add_smpp_user")
def addSmppUser():

    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    command = UserCommand(**request.json)

    if not command.port or command.port == 0:
        return jsonify({"status": "Port number is required"}), 200
    elif not command.username:
        return jsonify({"status": "Username is required"}), 200
    elif not command.password:
        return jsonify({"status": "Password is required"}), 200

    status = SmppUtils.add_smpp_user(command)
    return jsonify({"status": status}), 200

@app.delete("/api/delete_smpp_user/<username>")
def deleteSmppUser(username):

    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    status = SmppUtils.delete_smpp_user(username)
    return jsonify({"status": status}), 200

    


@app.post("/api/send_bulk_sms/")
def sendBulkSms():

    status, is_valid, user_id = SessionUtils.validate_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    data = request.get_json()

    receivers = data.get("receivers")
    print("Length of receivers in BULK SMS: ", len(receivers))

    status, user = SessionUtils.check_if_bulk_sms_allowed(request.headers.get('SESSIONID'), len(receivers))
    if status != "success":
        return jsonify({"status": status}), 200

    
    message = data.get("short_message")
    senderId = data.get("senderId")

    if not senderId:
        return jsonify({"status", "Sender name is required"}), 200
    elif not message:
        return jsonify({"status": "Message is required"}), 200
    elif receivers == None or not receivers:
        return jsonify({"status": "Receiver numbers are required"}), 200
    
    SmppUtils.send_bulk_sms(senderId, receivers, message, user)

    return jsonify({"status": status}), 200


@app.post("/api/send_a2p_sms")
def sendA2PSms():

    status, is_valid, user_id = SessionUtils.validate_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    data = request.get_json()

    # validate msisdn subscription
    
    sender_id = data.get("senderId")
    msisdn = data.get("msisdn")
    short_msg = data.get("short_message")

    if len(msisdn) != 7 and len(msisdn) != 10:
        return jsonify({"status": "Invalid length for mobile number"}), 200
    elif len(msisdn) == 7:
        msisdn = const.country_code + msisdn

    status = SmppUtils.send_single_a2p_sms(sender_id, msisdn, short_msg, user_id)

    return jsonify({"status": status}), 200



@app.get("/api/all_smpp_ports")
def getAllSmppPorts():
    
    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    smpp_ports = SmppUtils.get_all_smpp_ports()
    resp = [vo.to_dict() for vo in smpp_ports]
    return jsonify({"status": "success", "smppPorts": resp}), 200



@app.get("/api/all_sender_identifiers/<user_id>")
def getAllSenderIdentifiers(user_id):

    status, is_valid, session_user_id = SessionUtils.validate_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    sender_ids = SmppUtils.get_sender_identifiers(user_id)
    resp = [vo.to_dict() for vo in sender_ids]
    return jsonify({"status": "success", "senderIdentifiers": resp}), 200


@app.put("/api/activate_deactivate_smpp_port/<int:config_id>")
def activateOrDeactivateSmppPort(config_id):
    status, is_valid, user_id = SessionUtils.validate_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200

    return jsonify({"status": "success"}), 200


@app.put("/api/delete_user/<user_id>/<reason>")
def deleteUser(user_id, reason):
    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    status, is_valid = SmppUtils.delete_user(user_id, reason)
    if not is_valid:
        return jsonify({"status": status}), 200

    return jsonify({"status": "success"}), 200

@app.post("/api/send_test_email")
def sendTestEmail():
    
    SmppUtils.send_email_alert_for_sms_limit_reached("archana@inficloud.com", "Archana")
    return jsonify({"status": "success"}), 200


@app.get("/api/get_active_server_sessions")
def getActiveServerSessions():

    status, is_valid, user_id = SessionUtils.validate_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    

    active_servers = SmppUtils.get_active_smpp_server_sessions()
    return jsonify({"status": "success", "respList": active_servers})

@app.get("/api/users_count")
def getUsersCount():

    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    total_count, active_count = SmppUtils.get_users_count()

    return jsonify({"status": "success", "total_count": total_count, "active_count": active_count}), 200


@app.get("/api/get_sms_log_by_ref_id/<type>/<value>/<reference_id>")
def getSmsLogsBySearchTypeAndReferenceId(type, value, reference_id):

    status, is_valid, user_id = SessionUtils.validate_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200

    if type == None or (type != SmsSendType.SingleSms.value and type != SmsSendType.BulkSms.value):
        return jsonify({"status": "Invalid search type"}), 200
    elif type == SmsSendType.SingleSms.value:
        print
    elif type == SmsSendType.BulkSms.value:
        print

    return jsonify({"status": "success"}), 200


@app.put("/api/update_bulk_sms_enable_state/<user_id>/<bulk_status>")
def updateBulkSmsEnabledState(user_id, bulk_status):

    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200
    
    bulk_status = bool(bulk_status)
    
    status = SmppUtils.update_bulk_sms_enabled_state(user_id, bulk_status)
    return jsonify({"status": status}), 200


@app.put("/api/update_sms_limit/<user_id>/<sms_limit>")
def updateSmsLimit(user_id, sms_limit):

    status, is_valid = SessionUtils.validate_admin_session(request.headers.get('SESSIONID'))
    if not is_valid:
        return jsonify({"status": status}), 200

    status = SmppUtils.update_sms_limit(user_id, sms_limit)
    return jsonify({"status": status}), 200


def main():
    print(F"Loading SMTP deatils : {datetime.now()}")
    SmppUtils.load_smtp_details()


def run_flask():
    app.run(host="0.0.0.0", port=8007, debug=False)

if __name__ == '__main__':

    flask_thread = threading.Thread(target=run_flask, daemon=True)
    main_thread = threading.Thread(target=main)

    flask_thread.start()
    main_thread.start()

    flask_thread.join()
    main_thread.join()