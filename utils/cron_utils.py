from flask import Flask
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from database.db_config import get_db_session
from repos.user_repo import UserRepo
from models.user import User


def reset_sms_limit():
    print("Running SMS limit reset at:", datetime.now())

    db = next(get_db_session())
    user_repo = UserRepo(db)

    users = user_repo.find_all_users()
    for u in users:
        u.today_sms_count = 0
    db.session.commit()

    print("SMS limits updated successfully")


def start_scheduler():
    scheduler = BackgroundScheduler()

    # Run every day at 12:00 AM
    scheduler.add_job(
        func=reset_sms_limit,
        trigger='cron',
        hour=0,
        minute=0
    )

    scheduler.start()


# Start scheduler when app starts
start_scheduler()
