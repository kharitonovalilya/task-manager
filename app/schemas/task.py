from pydantic import BaseModel, validator
from datetime import date

class TaskBase(BaseModel):
    title: str
    description: str | None = None
    completed: bool = False
    deadline: date | None = None
    user_id: int
    team_id: int

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int

    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None
    deadline: date | None = None
    user_id: int | None = None
    team_id: int | None = None

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