from psycopg2.extras import RealDictCursor
from app.core.database import get_connection
from app.schemas.task import TaskCreate, TaskUpdate
from typing import Optional, List


def get_tasks():
    conn = get_connection()
    if not conn:
        return []
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM tasks ORDER BY id")
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return tasks


def get_tasks_filtered(
        current_user_id: int,
        user_id: Optional[int] = None,
        team_id: Optional[int] = None,
        completed: Optional[bool] = None
) -> List[dict]:
    """
    Возвращает задачи, доступные текущему пользователю:
    - где он исполнитель (user_id = current_user_id)
    - или он участник команды, которой принадлежит задача
    Плюс опциональная фильтрация по user_id, team_id, completed.
    """
    conn = get_connection()
    if not conn:
        return []
    cur = conn.cursor(cursor_factory=RealDictCursor)

    query = """
        SELECT t.* FROM tasks t
        WHERE (t.user_id = %(current)s OR t.team_id IN (
            SELECT team_id FROM team_members WHERE user_id = %(current)s
        ))
    """
    params = {"current": current_user_id}

    if user_id is not None:
        query += " AND t.user_id = %(user_id)s"
        params["user_id"] = user_id
    if team_id is not None:
        query += " AND t.team_id = %(team_id)s"
        params["team_id"] = team_id
    if completed is not None:
        query += " AND t.completed = %(completed)s"
        params["completed"] = completed

    query += " ORDER BY t.id"
    cur.execute(query, params)
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return tasks


def create_task(task: TaskCreate):
    conn = get_connection()
    if not conn:
        return None
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        """
        INSERT INTO tasks (title, description, completed, deadline, user_id, team_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING *
        """,
        (task.title, task.description, task.completed, task.deadline, task.user_id, task.team_id)
    )
    new_task = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return new_task

def get_task(task_id: int):
    conn = get_connection()
    if not conn:
        return None
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
    task = cur.fetchone()
    cur.close()
    conn.close()
    return task

def update_task(task_id: int, task_update: TaskUpdate):
    conn = get_connection()
    if not conn:
        return None
    cur = conn.cursor(cursor_factory=RealDictCursor)

    fields = []
    values = []
    for field, value in task_update.model_dump(exclude_unset=True).items():
        fields.append(f"{field} = %s")
        values.append(value)

    if not fields:
        cur.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
        return cur.fetchone()

    values.append(task_id)
    query = f"UPDATE tasks SET {', '.join(fields)} WHERE id = %s RETURNING *"
    cur.execute(query, values)
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return updated

def delete_task(task_id: int):
    conn = get_connection()
    if not conn:
        return False
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
    deleted = cur.rowcount > 0
    conn.commit()
    cur.close()
    conn.close()
    return deleted

def get_tasks_by_user(user_id: int):
    conn = get_connection()
    if not conn:
        return []
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM tasks WHERE user_id = %s ORDER BY id", (user_id,))
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return tasks

def get_tasks_by_team(team_id: int):
    conn = get_connection()
    if not conn:
        return []
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM tasks WHERE team_id = %s ORDER BY id", (team_id,))
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return tasks