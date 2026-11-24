import sqlite3
import os

backups = [
    ("Active SQLite DB", "college_erp.db"),
    ("Binary Snapshot Backup", os.path.join("backups", "college_erp_backup_20261016_phase2_pre.db")),
]

for name, path in backups:
    if os.path.exists(path):
        conn = sqlite3.connect(path)
        tables = conn.cursor().execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchone()[0]
        rows = 0
        for tbl in [r[0] for r in conn.cursor().execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]:
            rows += conn.cursor().execute(f'SELECT count(*) FROM "{tbl}"').fetchone()[0]
        size = os.path.getsize(path)
        print(f"{name}: EXISTS | Size: {size} bytes | Readable: YES | Tables: {tables} | Total Records: {rows}")
        conn.close()
    else:
        print(f"{name}: MISSING")

dump_path = os.path.join("backups", "college_erp_backup_dump.sql")
if os.path.exists(dump_path):
    with open(dump_path, "r", encoding="utf-8") as f:
        lines = len(f.readlines())
    print(f"ANSI SQL Dump: EXISTS | Size: {os.path.getsize(dump_path)} bytes | Lines: {lines} | Readable: YES")
