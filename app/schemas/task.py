from pydantic import BaseModel
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: str | None
    completed: bool = False
    deadline: datetime | None
    user_id: int
    team_id: int

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    title: str | None
    description: str | None
    completed: str | None
    deadline: str | None
    user_id: str | None
    team_id: str | None