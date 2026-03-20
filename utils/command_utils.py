from pydantic import BaseModel
from dataclasses import dataclass

@dataclass
class UserCommand:
    def __init__(
        self,
        username=None,
        fullName=None,
        email=None,
        smsLimit=None,
        isBulkUploadEnabled=None,
        companyName=None,
        msisdn=None,
        password=None,
        actualPassword=None,
        newPassword=None,
        senderName=None,
        port=None
    ):
        self.username = username
        self.fullName = fullName
        self.email = email
        self.smsLimit = smsLimit
        self.isBulkUploadEnabled = isBulkUploadEnabled
        self.companyName = companyName
        self.msisdn = msisdn
        self.password = password
        self.actualPassword = actualPassword
        self.newPassword = newPassword
        self.senderName = senderName
        self.port = port
    

