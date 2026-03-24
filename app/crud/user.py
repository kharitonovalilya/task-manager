from psycopg2.extras import RealDictCursor
from app.core.database import get_connection
from app.schemas.user import UserCreate
from app.core.security import hash_password

def get_user_by_email(email: str):
    conn = get_connection()
    if not conn:
        return None
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user

def create_user(user: UserCreate):
    conn = get_connection()
    if not conn:
        return None
    cur = conn.cursor(cursor_factory=RealDictCursor)
    hashed = hash_password(user.password)
    cur.execute(
        "INSERT INTO users (email, password) VALUES (%s, %s) RETURNING id, email",
        (user.email, hashed)
    )
    new_user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return new_user