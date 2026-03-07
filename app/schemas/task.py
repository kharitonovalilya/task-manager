from pydantic import BaseModel, validator
from datetime import date

class TaskBase(BaseModel):
    title: str
    description: str | None
    completed: bool = False
    deadline: date | None
    user_id: int
    team_id: int

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int

    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    title: str | None
    description: str | None
    completed: bool | None
    deadline: str | None
    user_id: str | None
    team_id: str | None

    @validator('completed', pre=True)
    def parse_completed(cls, v):
        if isinstance(v, str):
            return v.lower() == 'true'
        return v