from datetime import datetime, timezone
from typing import Any
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.orm import as_declarative, declared_attr


@as_declarative()
class Base:
    id: Any
    __name__: str

    # Automatically generate table name from class name (snake_case)
    @declared_attr
    def __tablename__(cls) -> str:
        name = cls.__name__
        # Convert CamelCase to snake_case
        return "".join(["_" + c.lower() if c.isupper() and i > 0 else c.lower() for i, c in enumerate(name)]) + "s"

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
