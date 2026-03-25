from psycopg2.extras import RealDictCursor
from app.core.database import get_connection
from app.schemas.task import TaskCreate, TaskUpdate
from typing import Optional
from app.crud.team import is_team_lead

def create_task(task: TaskCreate, current_user_id: int):
    conn = get_connection()
    if not conn:
        return None
    if not is_team_lead(current_user_id, task.team_id):
        raise PermissionError("Only team lead can create tasks")
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

def get_tasks_for_user(current_user_id: int, team_id: int | None = None, user_id: int | None = None, completed: bool | None = None):
    conn = get_connection()
    if not conn:
        return []
    cur = conn.cursor(cursor_factory=RealDictCursor)
    query = """
        SELECT t.* FROM tasks t
        WHERE (
            t.user_id = %s 
            OR t.team_id IN (
                SELECT team_id FROM team_members WHERE user_id = %s
            )
        )
    """
    params = [current_user_id, current_user_id]
    if team_id is not None:
        query += " AND t.team_id = %s"
        params.append(team_id)
    if user_id is not None:
        query += " AND t.user_id = %s"
        params.append(user_id)
    if completed is not None:
        query += " AND t.completed = %s"
        params.append(completed)
    query += " ORDER BY t.deadline ASC NULLS LAST"
    cur.execute(query, params)
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return tasks

def update_task(task_id: int, task_update: TaskUpdate):
    conn = get_connection()
    if not conn:
        return None
    cur = conn.cursor(cursor_factory=RealDictCursor)

    update_data = task_update.model_dump(exclude_unset=True)
    if not update_data:
        cur.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
        return cur.fetchone()

    fields = []
    values = []
    for field, value in update_data.items():
        fields.append(f"{field} = %s")
        values.append(value)

    values.append(task_id)
    query = f"UPDATE tasks SET {', '.join(fields)} WHERE id = %s RETURNING *"
    cur.execute(query, values)
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return updated

def delete_task(task_id: int, current_user_id: int) -> bool:
    conn = get_connection()
    if not conn:
        return False
    task = get_task(task_id)
    if not task:
        return False
    if not is_team_lead(current_user_id, task['team_id']):
        raise PermissionError("Only team lead can delete tasks")

    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
    deleted = cur.rowcount > 0
    conn.commit()
    cur.close()
    conn.close()
    return deleted

def toggle_task_complete(task_id: int) -> Optional[dict]:
    conn = get_connection()
    if not conn:
        return None
    
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("SELECT completed FROM tasks WHERE id = %s", (task_id,))
    task = cur.fetchone()
    
    if not task:
        cur.close()
        conn.close()
        return None

    new_status = not task["completed"]

    cur.execute(
        "UPDATE tasks SET completed = %s WHERE id = %s RETURNING *",
        (new_status, task_id)
    )
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return updated

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
    cur.execute(
        "SELECT * FROM tasks WHERE team_id = %s ORDER BY deadline ASC NULLS LAST",
        (team_id,)
    )
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return tasks