from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "db_taskmanager"
    DB_USER: str = "admin"
    DB_PASSWORD: str = "p@ssword"

    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()