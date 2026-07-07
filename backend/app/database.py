import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

logger = logging.getLogger("erp_database")
logging.basicConfig(level=logging.INFO)

Base = declarative_base()
SessionLocal = None
engine = None
is_sqlite_fallback = False

def init_db_connection():
    global engine, SessionLocal, is_sqlite_fallback
    try:
        # Try connecting to the specified DATABASE_URL (PostgreSQL)
        logger.info(f"Attempting to connect to database: {DATABASE_URL}")
        # Add a short connect_timeout to fail fast if PG is not reachable/wrong password
        if "postgresql" in DATABASE_URL:
            # Add timeout to dsn
            connect_args = {"connect_timeout": 3}
            engine = create_engine(DATABASE_URL, connect_args=connect_args)
        else:
            engine = create_engine(DATABASE_URL)
            
        # Verify connection
        with engine.connect() as conn:
            logger.info("Successfully connected to primary database.")
            
    except Exception as e:
        logger.warning(f"Failed to connect to primary database due to: {e}")
        logger.warning("Falling back to local SQLite database: sqlite:///ai_erp.db")
        is_sqlite_fallback = True
        sqlite_url = "sqlite:///ai_erp.db"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Run initialization immediately
init_db_connection()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
