from fastapi import APIRouter
from .endpoints import auth_router, teams_router, tasks_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(teams_router)
router.include_router(tasks_router)