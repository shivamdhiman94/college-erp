# Import all the models, so that Base has them before being
# imported by Alembic or used for table creation.
from app.db.base_class import Base  # noqa
from app.models.user import User, Admin, UserRole  # noqa
from app.models.academic import (  # noqa
    Department, Course, AcademicSession, Semester, Section,
    Subject, SubjectType, SubjectAllocation
)
from app.models.faculty import Faculty  # noqa
from app.models.student import Student, StudentStatus, Enrollment, EnrollmentStatus  # noqa
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceStatus  # noqa
from app.models.timetable import Timetable, Room, DayOfWeek, RoomType  # noqa
from app.models.exam import Exam, ExamSchedule, ExamType, ExamStatus  # noqa
from app.models.mark import Mark  # noqa
from app.models.assignment import Assignment, AssignmentSubmission, AssignmentStatus, SubmissionStatus  # noqa
from app.models.notice import Notice, NoticeRead, NoticeType, NoticePriority, NoticeStatus, NoticeTargetType  # noqa
from app.models.fee import FeeStructure, FeePayment, FeeStatus, PaymentMode  # noqa
from app.models.library import Book, LibraryIssue, IssueStatus  # noqa
from app.models.system import SystemSetting  # noqa
