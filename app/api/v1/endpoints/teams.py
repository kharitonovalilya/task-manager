from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.team import TeamCreate, Team, TeamMember, AddMemberByEmail
from app.schemas.task import Task  # добавлено
from app.crud import team as team_crud
from app.crud import task as task_crud
from app.crud import user as user_crud
from app.api.deps import get_current_user

router = APIRouter(prefix="/teams", tags=["Teams"])

@router.get("/", response_model=List[Team])
def list_teams(current_user: dict = Depends(get_current_user)):
    teams = team_crud.get_teams_by_user(current_user["id"])
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

@router.post("/{team_id}/members/add-by-email")
def add_member_by_email(
        team_id: int,
        payload: AddMemberByEmail,
        current_user: dict = Depends(get_current_user)
):
    team = team_crud.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team["lead_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only team lead can add members")

    user = user_crud.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if team_crud.is_member(user["id"], team_id):
        raise HTTPException(status_code=400, detail="User already in team")

    success = team_crud.add_member_to_team(user["id"], team_id)
    if not success:
        raise HTTPException(status_code=500, detail="Database error")

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

@router.get("/{team_id}/tasks", response_model=List[Task])
def get_team_tasks(team_id: int, current_user: dict = Depends(get_current_user)):
    # Проверяем, что пользователь является участником команды
    if not team_crud.is_member(current_user["id"], team_id):
        raise HTTPException(status_code=403, detail="You are not a member of this team")
    tasks = task_crud.get_tasks_by_team(team_id)
    return [Task(**t) for t in tasks]