from app.crud.user import get_user_by_email, create_user
from app.schemas.user import UserCreate

def seed_test_users():
    test_users = [
        {"email": "test@example.com", "password": "1234"},
        {"email": "test2@example.com", "password": "1234"},
        {"email": "test3@example.com", "password": "1234"},
        {"email": "test4@example.com", "password": "1234"},
        {"email": "test5@example.com", "password": "1234"},
        {"email": "test6@example.com", "password": "1234"},
        {"email": "test7@example.com", "password": "1234"},
        {"email": "test8@example.com", "password": "1234"},
        {"email": "test9@example.com", "password": "1234"},
        {"email": "test10@example.com", "password": "1234"},
        {"email": "test11@example.com", "password": "1234"},
        {"email": "test12@example.com", "password": "1234"},
        {"email": "test13@example.com", "password": "1234"},
        {"email": "test14@example.com", "password": "1234"},
        {"email": "test15@example.com", "password": "1234"},
    ]
    for user in test_users:
        existing = get_user_by_email(user["email"])
        if not existing:
            create_user(UserCreate(email=user["email"], password=user["password"]))