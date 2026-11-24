import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "..", "college_erp.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
tables = [row[0] for row in cursor.fetchall()]

print("=" * 60)
print(f"DATABASE VERIFICATION & AUDIT REPORT (Total Tables: {len(tables)})")
print("=" * 60)

total_rows = 0
for table in tables:
    cursor.execute(f'SELECT COUNT(*) FROM "{table}";')
    count = cursor.fetchone()[0]
    total_rows += count
    
    cursor.execute(f'PRAGMA table_info("{table}");')
    cols = cursor.fetchall()
    
    cursor.execute(f'PRAGMA foreign_key_list("{table}");')
    fks = cursor.fetchall()
    
    print(f"Table '{table}': {count} rows, {len(cols)} columns, {len(fks)} foreign keys")

print("-" * 60)
print(f"Total rows across all tables: {total_rows}")
print("=" * 60)

conn.close()
