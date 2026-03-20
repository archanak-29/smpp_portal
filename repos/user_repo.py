from sqlalchemy.orm import Session
from models.user import User
from sqlalchemy.exc import SQLAlchemyError
from typing import List

class UserRepo:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> User:
        sv= User()

        for k, v in kwargs.items():
            if hasattr(sv, k):
                setattr(sv, k, v)

        self.db.add(sv)
        self.db.commit()
        self.db.refresh(sv)
        return sv

    def get_user_by_user_name(self, user_name: str) -> User:
        try:
            return self.db.query(User).filter(
                (User.user_name == user_name) & (User.is_deleted == False)
            ).first()
        except (Exception, SQLAlchemyError) as e:
                self.db.rollback()
    
    def find_by_user_id(self, user_id: str) -> User:
        try:
            return self.db.query(User).filter(
                (User.user_id == user_id) & (User.is_deleted == False)
            ).first()
        except (Exception, SQLAlchemyError) as e:
                self.db.rollback()

    def find_all_users(self) -> List[User]:
        try:
            return self.db.query(User).filter(User.is_deleted == False).all()
        except (Exception, SQLAlchemyError) as e:
            self.db.rollback()
            print(f"Error fetching users: {e}")
            return []


    def find_by_email(self, email: str) -> User:
        try:
            return self.db.query(User).filter(
                (User.email == email) & (User.is_deleted == False)
            ).first()
        except (Exception, SQLAlchemyError) as e:
                self.db.rollback()

    def find_by_sender_id(self, sender_id: str):
        try:
             return 
        except (Exception, SQLAlchemyError) as e:
                self.db.rollback()

    def update_user(self, user_id: str, **kwargs) -> User:
        try:
            user = self.db.query(User).filter(
                (User.user_id == user_id) & (User.is_deleted == False)
            ).first()

            if not user:
                return None

            for k, v in kwargs.items():
                if hasattr(user, k):
                    setattr(user, k, v)

            self.db.commit()
            self.db.refresh(user)

            return user

        except SQLAlchemyError:
            self.db.rollback()
            raise
