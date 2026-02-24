from fastapi import FastAPI, HTTPException, status
from datetime import datetime, timedelta
from typing import Optional, List
from jose import jwt

from schemas import (
    UserCreate, User, LoginRequest, Token
)

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

users_db = []
user_id_counter = 1

app = FastAPI(title="Task Manager")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/register", response_model=User, status_code=201)
def register(user_data: UserCreate):
    global user_id_counter
    for u in users_db:
        if u["email"] == user_data.email:
            raise HTTPException(status_code=400, detail="Email already exists")
    new_user = {
        "id": user_id_counter,
        "email": user_data.email,
        "password": user_data.password,
        "is_active": True
    }
    users_db.append(new_user)
    user_id_counter += 1
    return User(id=new_user["id"], email=new_user["email"], is_active=new_user["is_active"])

@app.post("/login", response_model=Token)
def login(login_data: LoginRequest):
    user = None
    for u in users_db:
        if u["email"] == login_data.email and u["password"] == login_data.password:
            user = u
            break
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}