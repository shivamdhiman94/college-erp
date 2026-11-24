import sys
import os
from sqlalchemy import create_engine, text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings

def stamp_alembic_and_verify():
    print("=" * 60)
    print("STAMPING ALEMBIC VERSION & VERIFYING POSTGRESQL PARITY")
    print("=" * 60)
    
    pg_engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    with pg_engine.connect() as conn:
        with conn.begin():
            conn.execute(text("CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL, CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num))"))
            existing = conn.execute(text("SELECT version_num FROM alembic_version")).fetchone()
            if not existing:
                conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('c9b14ef24128')"))
                print("Alembic version 'c9b14ef24128' successfully stamped on PostgreSQL.")
            else:
                print(f"Alembic version already present: {existing[0]}")
                
        # Total rows audit
        print("\nAUDITING ROW COUNTS ON POSTGRESQL:")
        from scripts.migrate_sqlite_to_postgres import MIGRATION_TABLE_ORDER
        total_rows = 0
        for tbl in MIGRATION_TABLE_ORDER:
            c = conn.execute(text(f'SELECT count(*) FROM "{tbl}"')).scalar()
            total_rows += c
            if c > 0:
                print(f"   {tbl:<24}: {c} records")
        print("-" * 60)
        print(f"TOTAL RECORDS ON POSTGRESQL: {total_rows}")
        print("=" * 60)

if __name__ == "__main__":
    stamp_alembic_and_verify()
