from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Project root directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Store the database in the project root
DATABASE_URL = f"sqlite:///{(BASE_DIR / 'finpilot.db').as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    """Provide a database session for a FastAPI request."""
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()