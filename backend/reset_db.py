import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"DATABASE_URL: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    meta = MetaData()
    meta.reflect(bind=engine)
    print("Existing tables found:", list(meta.tables.keys()))
    print("Dropping all tables...")
    meta.drop_all(bind=engine)
    print("All tables dropped successfully.")
except Exception as e:
    print(f"Error resetting database: {e}")
