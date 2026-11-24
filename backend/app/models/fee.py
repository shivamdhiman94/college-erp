import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class FeeStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"


class PaymentMode(str, enum.Enum):
    ONLINE = "ONLINE"
    CASH = "CASH"
    CHEQUE = "CHEQUE"
    BANK_TRANSFER = "BANK_TRANSFER"


class FeeStructure(Base):
    __tablename__ = "fee_structures"
    __table_args__ = (
        UniqueConstraint("student_id", "semester_id", name="uq_student_semester_fee"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="RESTRICT"), nullable=False)
    tuition_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    lab_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    library_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    other_charges = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(Enum(FeeStatus), default=FeeStatus.UNPAID, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="fee_structures")
    semester = relationship("Semester", back_populates="fee_structures")
    payments = relationship("FeePayment", back_populates="fee_structure", cascade="all, delete-orphan")


class FeePayment(Base):
    __tablename__ = "fee_payments"

    id = Column(Integer, primary_key=True, index=True)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id", ondelete="CASCADE"), nullable=False)
    transaction_id = Column(String(100), unique=True, index=True, nullable=False)
    amount_paid = Column(Numeric(10, 2), nullable=False)
    payment_mode = Column(Enum(PaymentMode), default=PaymentMode.ONLINE, nullable=False)
    payment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    receipt_number = Column(String(100), unique=True, index=True, nullable=False)
    remarks = Column(String(255), nullable=True)
    recorded_by_admin_id = Column(Integer, ForeignKey("admins.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    fee_structure = relationship("FeeStructure", back_populates="payments")
    recorded_by = relationship("Admin", foreign_keys=[recorded_by_admin_id])
