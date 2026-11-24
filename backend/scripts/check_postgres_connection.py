import sys
import os
from sqlalchemy import create_engine, text, inspect

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings

def test_connection():
    print("=" * 60)
    print("TESTING POSTGRESQL CONNECTION & SCHEMA AUDIT")
    print("=" * 60)
    
    # Mask connection url
    url = settings.DATABASE_URL
    masked = url
    if "@" in url:
        parts = url.split("@")
        masked = f"...@{parts[-1]}"
    print(f"Target URL: {masked}")
    
    try:
        engine = create_engine(url, pool_pre_ping=True)
        with engine.connect() as conn:
            res = conn.execute(text("SELECT current_database(), current_user, version()")).fetchone()
            db_name = res[0]
            db_user = res[1]
            version = res[2]
            print(f"Connection Status: SUCCESSFUL")
            print(f"Current Database: {db_name}")
            print(f"Current User: {db_user}")
            print(f"PostgreSQL Version: {version.split(',')[0]}")
            
            # Check existing tables
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            print(f"\nExisting Tables in target database: {len(tables)}")
            if tables:
                for t in tables:
                    row_count = conn.execute(text(f'SELECT count(*) FROM "{t}"')).scalar()
                    print(f"   -> Table '{t}': {row_count} rows")
            else:
                print("   -> Target database is currently EMPTY (0 tables). Ready for clean migration.")
                
        return True, tables
    except Exception as e:
        print(f"Connection FAILED: {e}")
        return False, []

if __name__ == "__main__":
    test_connection()
