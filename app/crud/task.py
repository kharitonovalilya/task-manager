from psycopg2.extras import RealDictCursor
from app.core.database import get_connection
from app.schemas.task import TaskCreate, TaskUpdate

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