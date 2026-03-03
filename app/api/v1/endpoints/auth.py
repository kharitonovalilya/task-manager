from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from app.schemas.user import UserCreate, User, Token, LoginRequest
from app.core.security import create_access_token
from app.core.config import settings
from app.crud.user import get_user_by_email, create_user
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=User, status_code=201)
def register(user_data: UserCreate):
    if get_user_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already exists")
    new_user = create_user(user_data)
    if not new_user:
        raise HTTPException(status_code=500, detail="Database error")
    return User(id=new_user["id"], email=new_user["email"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest):
    user = get_user_by_email(login_data.email)
    if not user or user["password"] != login_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
def read_users_me(current_user: dict = Depends(get_current_user)):
    return User(id=current_user["id"], email=current_user["email"])