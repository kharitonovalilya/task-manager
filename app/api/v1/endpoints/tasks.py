from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.schemas.task import TaskCreate, Task, TaskUpdate
from app.crud import task as task_crud
from app.crud import team as team_crud
from app.api.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/", response_model=List[Task])
def list_tasks(
    team_id: Optional[int] = None,
    user_id: Optional[int] = None,
    completed: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Получить список задач с фильтрацией.
    Доступны только задачи, где пользователь является исполнителем или участником команды.
    """
    tasks = task_crud.get_tasks_filtered(
        user_id=user_id,
        team_id=team_id,
        completed=completed,
        current_user_id=current_user["id"]
    )
    return [Task(**t) for t in tasks]

@router.post("/", response_model=Task, status_code=201)
def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    # Проверка: можно создать задачу для себя или (если лид) для участника своей команды
    if task.user_id != current_user["id"]:
        # Проверим, является ли текущий пользователь лидом команды, в которой создаётся задача
        team = team_crud.get_team(task.team_id)
        if not team or team["lead_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only team lead can assign tasks to other members"
            )
        # Дополнительно можно проверить, что task.user_id действительно участник команды
        members = team_crud.get_team_members(task.team_id)
        if not any(m["id"] == task.user_id for m in members):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a member of this team"
            )
    new_task = task_crud.create_task(task)
    if not new_task:
        raise HTTPException(status_code=500, detail="Database error")
    return Task(**new_task)

@router.get("/{task_id}", response_model=Task)
def get_task(task_id: int, current_user: dict = Depends(get_current_user)):
    task = task_crud.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    # Проверка доступа: задача должна принадлежать пользователю или его команде
    if task["user_id"] != current_user["id"]:
        team = team_crud.get_team(task["team_id"])
        if not team or not team_crud.is_member(current_user["id"], task["team_id"]):
            raise HTTPException(status_code=403, detail="Access denied")
    return Task(**task)

@router.patch("/{task_id}", response_model=Task)
def update_task(task_id: int, task_update: TaskUpdate, current_user: dict = Depends(get_current_user)):
    task = task_crud.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    # Разрешено: исполнитель задачи или лид команды
    team = team_crud.get_team(task["team_id"])
    if task["user_id"] != current_user["id"] and (not team or team["lead_id"] != current_user["id"]):
        raise HTTPException(status_code=403, detail="Not allowed to update this task")
    updated = task_crud.update_task(task_id, task_update)
    if not updated:
        raise HTTPException(status_code=500, detail="Update failed")
    return Task(**updated)

@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, current_user: dict = Depends(get_current_user)):
    task = task_crud.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    # Удалять задачу может только лид команды
    team = team_crud.get_team(task["team_id"])
    if not team or team["lead_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only team lead can delete tasks")
    deleted = task_crud.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return