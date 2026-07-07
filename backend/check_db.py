import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        tables = ['users', 'budget', 'employees', 'ai_history', 'error_logs', 'inventory', 'agent_logs', 'system_health', 'suppliers', 'purchase_orders']
        for table in tables:
            try:
                res = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = res.scalar()
                print(f"Table '{table}': {count} rows")
            except Exception as table_err:
                print(f"Error querying '{table}': {table_err}")
except Exception as e:
    print(f"Error: {e}")
