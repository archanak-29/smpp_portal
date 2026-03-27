import smtplib
import logging
from concurrent.futures import ThreadPoolExecutor
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders


class EmailUtils:

    def __init__(self, smtp_server, smtp_port, username, password,
                 use_tls=True, max_workers=5, retry_count=3):

        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.use_tls = use_tls
        self.retry_count = retry_count

        self.executor = ThreadPoolExecutor(max_workers=max_workers)

        logging.basicConfig(level=logging.INFO)

    # get SMTP connection
    def _get_connection(self):
        server = smtplib.SMTP(self.smtp_server, self.smtp_port)

        if self.use_tls:
            server.starttls()

        server.login(self.username, self.password)

        return server


    def _build_message(self, to_email, subject, body, attachments=None):

        message = MIMEMultipart()
        message["From"] = self.username
        message["To"] = to_email
        message["Subject"] = subject

        message.attach(MIMEText(body, "plain"))

        if attachments:
            for file_path in attachments:

                with open(file_path, "rb") as f:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(f.read())

                encoders.encode_base64(part)

                part.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{file_path.split("/")[-1]}"'
                )

                message.attach(part)

        return message

   
    # send email sync
    def send_email(self, to_email, subject, body, attachments=None):

        for attempt in range(self.retry_count):

            try:

                server = self._get_connection()

                message = self._build_message(
                    to_email, subject, body, attachments
                )

                server.send_message(message)

                server.quit()

                logging.info(f"Email sent to {to_email}")

                return True

            except Exception as e:

                logging.error(f"Attempt {attempt+1} failed: {e}")

        return False


    # send async email
    def send_email_async(self, to_email, subject, body, attachments=None):

        self.executor.submit(
            self.send_email,
            to_email,
            subject,
            body,
            attachments
        )


    # bulk email sending sync
    def send_bulk_email(self, email_list, subject, body):

        results = {}

        for email in email_list:
            results[email] = self.send_email(email, subject, body)

        return results

    # Bulk email sending (async)
    def send_bulk_email_async(self, email_list, subject, body):

        for email in email_list:

            self.executor.submit(
                self.send_email,
                email,
                subject,
                body,
                None
            )




    