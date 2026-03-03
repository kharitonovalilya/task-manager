from psycopg2.extras import RealDictCursor
from app.core.database import get_connection
from app.schemas.team import TeamCreate

def get_teams():
    conn = get_connection()
    if not conn:
        return []
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM teams ORDER BY id")
    teams = cur.fetchall()
    cur.close()
    conn.close()
    return teams

def create_team(team: TeamCreate):
    conn = get_connection()
    if not conn:
        return None
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        "INSERT INTO teams (name) VALUES (%s) RETURNING *",
        (team.name,)
    )
    new_team = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return new_team

def get_team(team_id: int):
    conn = get_connection()
    if not conn:
        return None
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM teams WHERE id = %s", (team_id,))
    team = cur.fetchone()
    cur.close()
    conn.close()
    return team

def delete_team(team_id: int):
    conn = get_connection()
    if not conn:
        return False
    cur = conn.cursor()
    cur.execute("DELETE FROM teams WHERE id = %s", (team_id,))
    deleted = cur.rowcount > 0
    conn.commit()
    cur.close()
    conn.close()
    return deleted

def add_member_to_team(user_id: int, team_id: int):
    conn = get_connection()
    if not conn:
        return False
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO team_members (user_id, team_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
        (user_id, team_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return True

def remove_member_from_team(user_id: int, team_id: int):
    conn = get_connection()
    if not conn:
        return False
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM team_members WHERE user_id = %s AND team_id = %s",
        (user_id, team_id)
    )
    deleted = cur.rowcount > 0
    conn.commit()
    cur.close()
    conn.close()
    return deleted

def get_team_members(team_id: int):
    conn = get_connection()
    if not conn:
        return []
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT u.id, u.login FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        WHERE tm.team_id = %s
    """, (team_id,))
    members = cur.fetchall()
    cur.close()
    conn.close()
    return members