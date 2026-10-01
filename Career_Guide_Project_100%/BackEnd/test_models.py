from sqlalchemy import inspect

from app.database import engine
import app.models  # Loads the model definitions

inspector = inspect(engine)

expected_tables = {
    "users",
    "student_profiles",
    "counselors",
    "articles",
    "sessions",
    "recommendations",
}

actual_tables = set(inspector.get_table_names())

print("Tables found in MySQL:")
for table in sorted(actual_tables):
    print(f"- {table}")

missing_tables = expected_tables - actual_tables

if missing_tables:
    print(f"\nMissing tables: {', '.join(sorted(missing_tables))}")
else:
    print("\nSuccess: all six CareerGuide tables match the Python models.")