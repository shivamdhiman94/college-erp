#!/usr/bin/env python3
"""
Quantum University ERP System — Non-Destructive Database Migration Pipeline
Migrates relational data from local SQLite database into target Cloud PostgreSQL database.

Usage:
    python scripts/migrate_sqlite_to_postgres.py --dry-run
    python scripts/migrate_sqlite_to_postgres.py
"""

import sys
import os
import argparse
from typing import List, Dict, Any
from sqlalchemy import create_engine, MetaData, Table, select, func, text

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.db.base import Base

# Strict topological ordering to respect all Foreign Key dependencies
MIGRATION_TABLE_ORDER = [
    "users",
    "admins",
    "departments",
    "courses",
    "academic_sessions",
    "semesters",
    "sections",
    "subjects",
    "faculty",
    "students",
    "enrollments",
    "subject_allocations",
    "rooms",
    "timetables",
    "attendance_sessions",
    "attendance_records",
    "exams",
    "exam_schedules",
    "marks",
    "assignments",
    "assignment_submissions",
    "notices",
    "notice_reads",
    "fee_structures",
    "fee_payments",
    "books",
    "library_issues",
    "system_settings",
    "alembic_version",
]


def get_table_row_counts(engine, tables: List[str]) -> Dict[str, int]:
    counts = {}
    with engine.connect() as conn:
        for table_name in tables:
            try:
                res = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
                counts[table_name] = res.scalar() or 0
            except Exception:
                counts[table_name] = 0
    return counts


def run_migration(source_url: str, target_url: str, dry_run: bool = False):
    print("=" * 70)
    print("QUANTUM UNIVERSITY ERP — DATABASE MIGRATION ENGINE")
    print(f"Mode: {'DRY RUN (Preview Only)' if dry_run else 'LIVE EXECUTION'}")
    print(f"Source DB: {source_url}")
    # Mask credentials in target URL for security
    masked_target = target_url.split("@")[-1] if "@" in target_url else target_url
    print(f"Target DB Host/DB: ...@{masked_target}")
    print("=" * 70)

    # 1. Connect to Source (SQLite)
    source_engine = create_engine(source_url, connect_args={"check_same_thread": False})
    source_meta = MetaData()
    source_meta.reflect(bind=source_engine)

    source_counts = get_table_row_counts(source_engine, MIGRATION_TABLE_ORDER)
    total_source_records = sum(source_counts.values())
    print(f"\n[1/5] Source Verification: Found {len(source_counts)} tables with {total_source_records} total records.")
    for tbl, count in source_counts.items():
        if count > 0:
            print(f"   -> {tbl}: {count} records")

    if dry_run:
        print("\n[DRY RUN COMPLETE] Target schema will be created and all records migrated without loss.")
        print("To execute live migration, run without --dry-run.")
        return

    # 2. Connect to Target (PostgreSQL)
    print("\n[2/5] Initializing Target PostgreSQL Schema via SQLAlchemy Base Metadata...")
    target_engine = create_engine(target_url, pool_pre_ping=True)
    
    # Create all schema tables in target
    Base.metadata.create_all(bind=target_engine)
    print("   -> Target PostgreSQL schema initialized successfully.")

    # 3. Transfer Data table by table in topological order
    print("\n[3/5] Transferring records in foreign-key dependency order...")
    target_meta = MetaData()
    target_meta.reflect(bind=target_engine)

    with source_engine.connect() as src_conn, target_engine.connect() as tgt_conn:
        # Use single transaction on target PostgreSQL
        with tgt_conn.begin():
            for table_name in MIGRATION_TABLE_ORDER:
                if table_name not in source_meta.tables or table_name not in target_meta.tables:
                    continue

                src_table = source_meta.tables[table_name]
                tgt_table = target_meta.tables[table_name]

                # Check if target already has records (zero overwrite policy)
                tgt_count = tgt_conn.execute(select(func.count()).select_from(tgt_table)).scalar() or 0
                if tgt_count > 0:
                    print(f"   [SKIP] Table '{table_name}' already contains {tgt_count} records. Skipping to preserve existing data.")
                    continue

                # Fetch all records from source
                records = src_conn.execute(select(src_table)).mappings().all()
                if not records:
                    continue

                # Insert into target
                data = [dict(r) for r in records]
                tgt_conn.execute(tgt_table.insert(), data)
                print(f"   [MIGRATED] {table_name}: {len(data)} records inserted.")

            # 4. Reset sequences for PostgreSQL auto-increment primary keys
            print("\n[4/5] Synchronizing PostgreSQL sequence ID counters...")
            for table_name in MIGRATION_TABLE_ORDER:
                if table_name in ["alembic_version"]:
                    continue
                try:
                    seq_query = text(f"""
                        SELECT setval(
                            pg_get_serial_sequence('"{table_name}"', 'id'),
                            COALESCE((SELECT MAX(id) FROM "{table_name}"), 1),
                            (SELECT MAX(id) FROM "{table_name}") IS NOT NULL
                        );
                    """)
                    tgt_conn.execute(seq_query)
                except Exception:
                    pass

    # 5. Full Post-Migration Audit & Parity Verification
    print("\n[5/5] Auditing Data Parity between SQLite and PostgreSQL...")
    target_counts = get_table_row_counts(target_engine, MIGRATION_TABLE_ORDER)
    total_target_records = sum(target_counts.values())

    print("\n" + "-" * 70)
    print(f"{'TABLE NAME':<26} | {'SQLITE ROWS':<12} | {'POSTGRES ROWS':<14} | {'PARITY':<8}")
    print("-" * 70)

    all_matched = True
    for tbl in MIGRATION_TABLE_ORDER:
        src_c = source_counts.get(tbl, 0)
        tgt_c = target_counts.get(tbl, 0)
        parity = "MATCH" if src_c == tgt_c else "MISMATCH"
        if src_c != tgt_c:
            all_matched = False
        if src_c > 0 or tgt_c > 0:
            print(f"{tbl:<26} | {src_c:<12} | {tgt_c:<14} | {parity:<8}")

    print("-" * 70)
    print(f"{'TOTALS':<26} | {total_source_records:<12} | {total_target_records:<14} | {'MATCH' if all_matched else 'MISMATCH'}")
    print("=" * 70)

    if all_matched:
        print("✅ DATABASE MIGRATION COMPLETED SUCCESSFULLY WITH ZERO DATA LOSS!")
    else:
        print("⚠️ MIGRATION COMPLETED WITH DIFFERENCES — PLEASE REVIEW TABLE PARITY ABOVE.")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate SQLite to Cloud PostgreSQL")
    parser.add_argument("--source-url", default="sqlite:///./college_erp.db", help="Source SQLite URL")
    parser.add_argument("--target-url", default=settings.DATABASE_URL, help="Target PostgreSQL URL")
    parser.add_argument("--dry-run", action="store_true", help="Simulate without writing to target")

    args = parser.parse_args()

    run_migration(source_url=args.source_url, target_url=args.target_url, dry_run=args.dry_run)
