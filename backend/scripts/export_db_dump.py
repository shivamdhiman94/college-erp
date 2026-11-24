import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "..", "college_erp.db")
sql_dump_path = os.path.join(os.path.dirname(__file__), "..", "backups", "college_erp_backup_dump.sql")

conn = sqlite3.connect(db_path)
with open(sql_dump_path, "w", encoding="utf-8") as f:
    for line in conn.iterdump():
        f.write(f"{line}\n")
conn.close()

file_size = os.path.getsize(sql_dump_path)
print(f"SQL Dump successfully created at {sql_dump_path} ({file_size} bytes)")
