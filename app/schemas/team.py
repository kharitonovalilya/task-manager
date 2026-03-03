from pydantic import BaseModel

class TeamBase(BaseModel):
    name: str

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: int

    class Config:
        from_attributes = True

class TeamMember(BaseModel):
    user_id: int
    team_id: int