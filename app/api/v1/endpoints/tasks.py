from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.task import TaskCreate, Task, TaskUpdate
from app.crud import task as task_crud
from app.api.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[Task])
def list_tasks(current_user: dict = Depends(get_current_user)):
    tasks = task_crud.get_tasks()
    return [Task(**t) for t in tasks]

@router.post("/", response_model=Task, status_code=201)
def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    new_task = task_crud.create_task(task, current_user["id"])
    if not new_task:
        raise HTTPException(status_code=500, detail="Database error")
    return Task(**new_task)

@router.get("/{task_id}", response_model=Task)
def get_task(task_id: int, current_user: dict = Depends(get_current_user)):
    task = task_crud.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**task)

@router.patch("/{task_id}", response_model=Task)
def update_task(task_id: int, task_update: TaskUpdate, current_user: dict = Depends(get_current_user)):
    task = task_crud.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    updated = task_crud.update_task(task_id, task_update)
    if not updated:
        raise HTTPException(status_code=500, detail="Update failed")
    return Task(**updated)

@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, current_user: dict = Depends(get_current_user)):
    deleted = task_crud.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return

@router.get("/user/{user_id}", response_model=List[Task])
def get_user_tasks(user_id: int, current_user: dict = Depends(get_current_user)):
    tasks = task_crud.get_tasks_by_user(user_id)
    return [Task(**t) for t in tasks]

@router.get("/team/{team_id}", response_model=List[Task])
def get_team_tasks(team_id: int, current_user: dict = Depends(get_current_user)):
    tasks = task_crud.get_tasks_by_team(team_id)
    return [Task(**t) for t in tasks]