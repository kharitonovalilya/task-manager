from pydantic import BaseModel

class TeamBase(BaseModel):
    name: str
    lead_id: int

class TeamCreate(BaseModel):
    name: str

class Team(TeamBase):
    id: int
    lead_id: int
    class Config:
        from_attributes = True

class TeamMember(BaseModel):
    user_id: int
    team_id: int
    is_lead: bool = False