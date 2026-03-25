from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db
from app.core.seeder import seed_test_users
from app.api.v1 import router as v1_router

# create app
app = FastAPI(title = "Task Manager API")

# create tables if they are not exist
init_db()

# create test users
seed_test_users()

# allow front
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost",
    "http://localhost:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#include routers
app.include_router(v1_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Task Planner API is running", "docs": "/docs"}