from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.team import TeamCreate, Team, TeamMember
from app.crud import team as team_crud
from app.api.deps import get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("/", response_model=List[Team])
def list_teams(current_user: dict = Depends(get_current_user)):
    teams = team_crud.get_teams()
    return [Team(**t) for t in teams]

@router.post("/", response_model=Team, status_code=201)
def create_team(team: TeamCreate, current_user: dict = Depends(get_current_user)):
    new_team = team_crud.create_team(team, current_user["id"])
    if not new_team:
        raise HTTPException(status_code=500, detail="Database error")
    return Team(**new_team)

@router.get("/{team_id}", response_model=Team)
def get_team(team_id: int, current_user: dict = Depends(get_current_user)):
    team = team_crud.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return Team(**team)

@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: int, current_user: dict = Depends(get_current_user)):
    deleted = team_crud.delete_team(team_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Team not found")
    return

@router.post("/{team_id}/members/{user_id}")
def add_member(team_id: int, user_id: int, current_user: dict = Depends(get_current_user)):
    success = team_crud.add_member_to_team(user_id, team_id)
    if not success:
        raise HTTPException(status_code=400, detail="Could not add member")
    return {"message": "Member added"}

@router.delete("/{team_id}/members/{user_id}")
def remove_member(team_id: int, user_id: int, current_user: dict = Depends(get_current_user)):
    success = team_crud.remove_member_from_team(user_id, team_id)
    if not success:
        raise HTTPException(status_code=404, detail="Member not found in team")
    return {"message": "Member removed"}

@router.get("/{team_id}/members", response_model=List[dict])
def get_members(team_id: int, current_user: dict = Depends(get_current_user)):
    members = team_crud.get_team_members(team_id)
    return members