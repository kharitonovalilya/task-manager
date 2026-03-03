import psycopg2
from psycopg2 import sql, OperationalError
from app.core.config import settings
import os

DB_CONFIG = {
    'host': settings.DB_HOST,
    'port': settings.DB_PORT,
    'database': settings.DB_NAME,
    'user': settings.DB_USER,
    'password': settings.DB_PASSWORD,
}

def get_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except OperationalError as e:
        print(f"Can't connect to DB: {e}")
        return None

def get_db():
    conn = get_connection()
    if conn is None:
        raise Exception("Can't connect to DB")
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = get_connection()
    if conn is None:
        print("Can't connect to DB")
        return
    cur = conn.cursor()
    sql_file = os.path.join(os.path.dirname(__file__), '..', 'db', 'init.sql')
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    try:
        cur.execute(sql_script)
        conn.commit()
        print("Tables is created")
    except Exception as e:
        print(f"Can't run init.sql: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()