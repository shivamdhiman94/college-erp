import enum
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class IssueStatus(str, enum.Enum):
    ISSUED = "ISSUED"
    RETURNED = "RETURNED"
    OVERDUE = "OVERDUE"
    LOST = "LOST"


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    isbn = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    author = Column(String(200), nullable=False)
    publisher = Column(String(150), nullable=True)
    category = Column(String(100), nullable=True)
    total_copies = Column(Integer, default=1, nullable=False)
    available_copies = Column(Integer, default=1, nullable=False)
    rack_location = Column(String(50), nullable=True)

    # Relationships
    issues = relationship("LibraryIssue", back_populates="book")


class LibraryIssue(Base):
    __tablename__ = "library_issues"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="RESTRICT"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=True)
    fine_amount = Column(Numeric(8, 2), default=0.00, nullable=False)
    status = Column(Enum(IssueStatus), default=IssueStatus.ISSUED, nullable=False)
    issued_by_admin_id = Column(Integer, ForeignKey("admins.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    book = relationship("Book", back_populates="issues")
    user = relationship("User", back_populates="library_issues", foreign_keys=[user_id])
    issued_by = relationship("Admin", foreign_keys=[issued_by_admin_id])
