from app.crud.user import get_user_by_email, create_user
from app.schemas.user import UserCreate

def seed_test_users():
    test_users = [
        {"email": "test@example.com", "password": "ebalaya123"},
        {"email": "test2@example.com", "password": "ebalaya123"},
    ]
    for user in test_users:
        existing = get_user_by_email(user["email"])
        if not existing:
            create_user(UserCreate(email=user["email"], password=user["password"]))