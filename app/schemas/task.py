from pydantic import BaseModel, validator
from datetime import date
from typing import Optional

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    deadline: Optional[date] = None
    user_id: int
    team_id: int

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int

    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    deadline: Optional[date] = None
    user_id: Optional[int] = None
    team_id: Optional[int] = None

    @validator('completed', pre=True)
    def parse_completed(cls, v):
        if isinstance(v, str):
            return v.lower() == 'true'
        return v

    @validator('deadline', pre=True)
    def parse_deadline(cls, v):
        if isinstance(v, str) and v:
            return date.fromisoformat(v)
        return v