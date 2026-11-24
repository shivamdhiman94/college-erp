import sys
import os
from datetime import date, time, datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.config import settings
from app.core.security import get_password_hash
from app.core.grading import calculate_grade
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User, Admin, UserRole
from app.models.academic import (
    Department, Course, AcademicSession, Semester, Section, Subject, SubjectType, SubjectAllocation
)
from app.models.faculty import Faculty
from app.models.student import Student, StudentStatus, Enrollment, EnrollmentStatus
from app.models.timetable import Room, RoomType, Timetable, DayOfWeek
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceStatus
from app.models.exam import Exam, ExamSchedule, ExamType, ExamStatus
from app.models.mark import Mark
from app.models.assignment import Assignment, AssignmentSubmission, AssignmentStatus, SubmissionStatus
from app.models.notice import Notice, NoticeRead, NoticeType, NoticePriority, NoticeStatus, NoticeTargetType


def seed_demo_data():
    print("=" * 60)
    print("Populating Quantum University ERP System with Realistic Demo Dataset")
    print("=" * 60)

    # Recreate all tables cleanly
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Super Admin (Shivam)
        admin_user = db.query(User).filter(User.username == "shivam").first()
        if not admin_user:
            admin_user = User(
                email="shivam@quantum.edu",
                username="shivam",
                hashed_password=get_password_hash("shivam@123"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

            admin_profile = Admin(
                user_id=admin_user.id,
                first_name="Shivam",
                last_name="Kumar",
                phone="9876543210",
                designation="Director of IT & Academic Operations"
            )
            db.add(admin_profile)
            db.commit()
            print("[OK] Created Super Admin: shivam (shivam@quantum.edu / shivam@123)")

        # 2. Departments
        departments = [
            {"code": "CSE", "name": "Computer Science & Engineering", "description": "Department of Computer Science, Software Engineering & AI"},
            {"code": "ECE", "name": "Electronics & Communication Engineering", "description": "Department of VLSI, Embedded Systems and Telecommunications"},
            {"code": "ME", "name": "Mechanical Engineering", "description": "Department of Thermodynamics, Robotics & CAD/CAM"},
            {"code": "MBA", "name": "Department of Business & Management", "description": "School of Business Administration and Leadership Studies"},
        ]
        dept_map = {}
        for d in departments:
            dept = db.query(Department).filter(Department.code == d["code"]).first()
            if not dept:
                dept = Department(**d)
                db.add(dept)
                db.commit()
                db.refresh(dept)
            dept_map[d["code"]] = dept
        print(f"[OK] Seeded {len(dept_map)} Academic Departments")

        # 3. Degree Courses
        courses = [
            {"department_id": dept_map["CSE"].id, "code": "BTECH_CSE", "name": "Bachelor of Technology in Computer Science", "duration_years": 4, "total_semesters": 8},
            {"department_id": dept_map["ECE"].id, "code": "BTECH_ECE", "name": "Bachelor of Technology in Electronics & Communication", "duration_years": 4, "total_semesters": 8},
            {"department_id": dept_map["MBA"].id, "code": "MBA_GEN", "name": "Master of Business Administration", "duration_years": 2, "total_semesters": 4},
        ]
        course_map = {}
        for c in courses:
            crs = db.query(Course).filter(Course.code == c["code"]).first()
            if not crs:
                crs = Course(**c)
                db.add(crs)
                db.commit()
                db.refresh(crs)
            course_map[c["code"]] = crs
        print(f"[OK] Seeded {len(course_map)} Degree Programs")

        # 4. Academic Session
        session = db.query(AcademicSession).filter(AcademicSession.name == "2025-2026 Academic Year").first()
        if not session:
            session = AcademicSession(
                name="2025-2026 Academic Year",
                start_date=date(2025, 8, 1),
                end_date=date(2026, 6, 30),
                is_current=True
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        print(f"[OK] Active Academic Session: {session.name}")

        # 5. Semesters
        sem1_cse = db.query(Semester).filter(
            Semester.course_id == course_map["BTECH_CSE"].id,
            Semester.semester_number == 1
        ).first()
        if not sem1_cse:
            sem1_cse = Semester(
                course_id=course_map["BTECH_CSE"].id,
                academic_session_id=session.id,
                semester_number=1,
                name="Semester 1"
            )
            db.add(sem1_cse)
            db.commit()
            db.refresh(sem1_cse)

        # 6. Sections
        sec_a = db.query(Section).filter(Section.semester_id == sem1_cse.id, Section.name == "A").first()
        if not sec_a:
            sec_a = Section(semester_id=sem1_cse.id, name="A", capacity=60)
            db.add(sec_a)
            db.commit()
            db.refresh(sec_a)

        sec_b = db.query(Section).filter(Section.semester_id == sem1_cse.id, Section.name == "B").first()
        if not sec_b:
            sec_b = Section(semester_id=sem1_cse.id, name="B", capacity=60)
            db.add(sec_b)
            db.commit()
            db.refresh(sec_b)

        # 7. Subjects
        subjects_data = [
            {"course_id": course_map["BTECH_CSE"].id, "department_id": dept_map["CSE"].id, "code": "CS101", "name": "Data Structures & Algorithms", "credits": 4.0, "semester_number": 1, "type": SubjectType.THEORY},
            {"course_id": course_map["BTECH_CSE"].id, "department_id": dept_map["CSE"].id, "code": "CS102", "name": "Database Management Systems", "credits": 4.0, "semester_number": 1, "type": SubjectType.THEORY},
            {"course_id": course_map["BTECH_CSE"].id, "department_id": dept_map["CSE"].id, "code": "CS103", "name": "Computer Programming & Data Lab", "credits": 2.0, "semester_number": 1, "type": SubjectType.PRACTICAL},
            {"course_id": course_map["BTECH_CSE"].id, "department_id": dept_map["CSE"].id, "code": "MA101", "name": "Engineering Mathematics I", "credits": 4.0, "semester_number": 1, "type": SubjectType.THEORY},
            {"course_id": course_map["BTECH_CSE"].id, "department_id": dept_map["ECE"].id, "code": "EC101", "name": "Basic Electronics Engineering", "credits": 3.0, "semester_number": 1, "type": SubjectType.THEORY},
        ]
        sub_map = {}
        for s in subjects_data:
            sub = db.query(Subject).filter(Subject.code == s["code"]).first()
            if not sub:
                sub = Subject(**s)
                db.add(sub)
                db.commit()
                db.refresh(sub)
            sub_map[s["code"]] = sub
        print(f"[OK] Seeded {len(sub_map)} Curriculum Subjects")

        # 8. Faculty Members (Riya, Sonu, Niraj, Kartik)
        faculty_seed = [
            {
                "username": "riya",
                "email": "riya@quantum.edu",
                "password": "riya@123",
                "first_name": "Riya",
                "last_name": "Sharma",
                "emp_code": "FAC-CSE-001",
                "dept": dept_map["CSE"],
                "designation": "Professor & Head of Department",
                "qualification": "Ph.D. in Computer Science & AI"
            },
            {
                "username": "sonu",
                "email": "sonu@quantum.edu",
                "password": "sonu@123",
                "first_name": "Sonu",
                "last_name": "Kumar",
                "emp_code": "FAC-CSE-002",
                "dept": dept_map["CSE"],
                "designation": "Associate Professor",
                "qualification": "M.Tech in Software Systems"
            },
            {
                "username": "niraj",
                "email": "niraj@quantum.edu",
                "password": "niraj@123",
                "first_name": "Niraj",
                "last_name": "Singh",
                "emp_code": "FAC-ECE-001",
                "dept": dept_map["ECE"],
                "designation": "Assistant Professor",
                "qualification": "M.Tech in VLSI & Microelectronics"
            },
            {
                "username": "kartik",
                "email": "kartik@quantum.edu",
                "password": "kartik@123",
                "first_name": "Kartik",
                "last_name": "Verma",
                "emp_code": "FAC-ME-001",
                "dept": dept_map["ME"],
                "designation": "Assistant Professor",
                "qualification": "M.Tech in Thermal Engineering"
            },
        ]
        fac_map = {}
        for f in faculty_seed:
            u = db.query(User).filter(User.username == f["username"]).first()
            if not u:
                u = User(
                    email=f["email"],
                    username=f["username"],
                    hashed_password=get_password_hash(f["password"]),
                    role=UserRole.FACULTY,
                    is_active=True
                )
                db.add(u)
                db.commit()
                db.refresh(u)

                prof = Faculty(
                    user_id=u.id,
                    department_id=f["dept"].id,
                    employee_code=f["emp_code"],
                    first_name=f["first_name"],
                    last_name=f["last_name"],
                    designation=f["designation"],
                    qualification=f["qualification"],
                    joining_date=date(2020, 7, 1)
                )
                db.add(prof)
                db.commit()
                db.refresh(prof)
                fac_map[f["username"]] = prof
            else:
                fac_map[f["username"]] = db.query(Faculty).filter(Faculty.user_id == u.id).first()
        print(f"[OK] Seeded {len(fac_map)} Faculty Profiles (Riya, Sonu, Niraj, Kartik)")

        # 9. Teaching Allocations
        alloc_data = [
            {"faculty": fac_map["riya"], "subject": sub_map["CS101"], "section": sec_a},
            {"faculty": fac_map["riya"], "subject": sub_map["CS101"], "section": sec_b},
            {"faculty": fac_map["sonu"], "subject": sub_map["CS102"], "section": sec_a},
            {"faculty": fac_map["sonu"], "subject": sub_map["CS103"], "section": sec_a},
            {"faculty": fac_map["niraj"], "subject": sub_map["EC101"], "section": sec_a},
            {"faculty": fac_map["kartik"], "subject": sub_map["MA101"], "section": sec_a},
        ]
        alloc_map = {}
        for al in alloc_data:
            exist_al = db.query(SubjectAllocation).filter(
                SubjectAllocation.faculty_id == al["faculty"].id,
                SubjectAllocation.subject_id == al["subject"].id,
                SubjectAllocation.section_id == al["section"].id,
            ).first()
            if not exist_al:
                exist_al = SubjectAllocation(
                    faculty_id=al["faculty"].id,
                    subject_id=al["subject"].id,
                    section_id=al["section"].id,
                    academic_session_id=session.id
                )
                db.add(exist_al)
                db.commit()
                db.refresh(exist_al)
            alloc_map[f"{al['subject'].code}_{al['section'].name}"] = exist_al
        print(f"[OK] Seeded {len(alloc_map)} Subject Teaching Allocations")

        # 10. Students (Real Indian names)
        students_seed = [
            {"username": "aarav", "email": "aarav@student.quantum.edu", "password": "aarav@123", "first_name": "Aarav", "last_name": "Sharma", "roll": "25CS01", "enr": "ENR2025CS001", "sec": sec_a},
            {"username": "priya", "email": "priya@student.quantum.edu", "password": "priya@123", "first_name": "Priya", "last_name": "Patel", "roll": "25CS02", "enr": "ENR2025CS002", "sec": sec_a},
            {"username": "rahul", "email": "rahul@student.quantum.edu", "password": "rahul@123", "first_name": "Rahul", "last_name": "Verma", "roll": "25CS03", "enr": "ENR2025CS003", "sec": sec_a},
            {"username": "sneha", "email": "sneha@student.quantum.edu", "password": "sneha@123", "first_name": "Sneha", "last_name": "Gupta", "roll": "25CS04", "enr": "ENR2025CS004", "sec": sec_b},
            {"username": "rohan", "email": "rohan@student.quantum.edu", "password": "rohan@123", "first_name": "Rohan", "last_name": "Singh", "roll": "25CS05", "enr": "ENR2025CS005", "sec": sec_b},
        ]
        student_map = {}
        for s in students_seed:
            u = db.query(User).filter(User.username == s["username"]).first()
            if not u:
                u = User(
                    email=s["email"],
                    username=s["username"],
                    hashed_password=get_password_hash(s["password"]),
                    role=UserRole.STUDENT,
                    is_active=True
                )
                db.add(u)
                db.commit()
                db.refresh(u)

                stu = Student(
                    user_id=u.id,
                    department_id=dept_map["CSE"].id,
                    course_id=course_map["BTECH_CSE"].id,
                    admission_session_id=session.id,
                    enrollment_number=s["enr"],
                    roll_number=s["roll"],
                    first_name=s["first_name"],
                    last_name=s["last_name"],
                    admission_date=date(2025, 8, 10),
                    current_semester_id=sem1_cse.id,
                    current_section_id=s["sec"].id,
                    status=StudentStatus.ACTIVE
                )
                db.add(stu)
                db.commit()
                db.refresh(stu)

                enr = Enrollment(
                    student_id=stu.id,
                    semester_id=sem1_cse.id,
                    section_id=s["sec"].id,
                    enrolled_date=date(2025, 8, 10),
                    status=EnrollmentStatus.ENROLLED
                )
                db.add(enr)
                db.commit()
                student_map[s["username"]] = stu
            else:
                student_map[s["username"]] = db.query(Student).filter(Student.user_id == u.id).first()
        print(f"[OK] Seeded {len(student_map)} Enrolled Students (Aarav, Priya, Rahul, Sneha, Rohan)")

        # 11. Campus Rooms
        rooms_seed = [
            {"room_number": "LH-101", "type": RoomType.CLASSROOM, "capacity": 75, "building": "Academic Block A", "floor": 1},
            {"room_number": "LH-102", "type": RoomType.CLASSROOM, "capacity": 75, "building": "Academic Block A", "floor": 1},
            {"room_number": "LAB-CS-1", "type": RoomType.LABORATORY, "capacity": 45, "building": "Tech Tower", "floor": 2},
            {"room_number": "AUD-01", "type": RoomType.AUDITORIUM, "capacity": 350, "building": "Student Center", "floor": 1},
        ]
        room_map = {}
        for r in rooms_seed:
            rm = db.query(Room).filter(Room.room_number == r["room_number"]).first()
            if not rm:
                rm = Room(room_number=r["room_number"], type=r["type"], capacity=r["capacity"], building=r["building"], floor=r["floor"])
                db.add(rm)
                db.commit()
                db.refresh(rm)
            room_map[r["room_number"]] = rm
        print("[OK] Seeded 4 Campus Physical Rooms")

        # 12. Weekly Timetable (Section A)
        tt_slots = [
            {"allocation": alloc_map["CS101_A"], "day": DayOfWeek.MONDAY, "start": time(9, 0), "end": time(10, 0), "room": room_map["LH-101"]},
            {"allocation": alloc_map["CS102_A"], "day": DayOfWeek.MONDAY, "start": time(10, 0), "end": time(11, 0), "room": room_map["LH-101"]},
            {"allocation": alloc_map["CS103_A"], "day": DayOfWeek.TUESDAY, "start": time(9, 0), "end": time(11, 0), "room": room_map["LAB-CS-1"]},
            {"allocation": alloc_map["EC101_A"], "day": DayOfWeek.WEDNESDAY, "start": time(9, 0), "end": time(10, 0), "room": room_map["LH-102"]},
            {"allocation": alloc_map["CS101_A"], "day": DayOfWeek.THURSDAY, "start": time(9, 0), "end": time(10, 0), "room": room_map["LH-101"]},
            {"allocation": alloc_map["CS102_A"], "day": DayOfWeek.FRIDAY, "start": time(10, 0), "end": time(11, 0), "room": room_map["LH-101"]},
        ]
        for t in tt_slots:
            exist_tt = db.query(Timetable).filter(
                Timetable.subject_allocation_id == t["allocation"].id,
                Timetable.day_of_week == t["day"],
                Timetable.start_time == t["start"]
            ).first()
            if not exist_tt:
                exist_tt = Timetable(
                    subject_allocation_id=t["allocation"].id,
                    day_of_week=t["day"],
                    start_time=t["start"],
                    end_time=t["end"],
                    room_id=t["room"].id,
                    room_number=t["room"].room_number
                )
                db.add(exist_tt)
                db.commit()
        print("[OK] Seeded Conflict-Free Weekly Lecture Timetable")

        # 13. Attendance Sessions & Records
        sec_a_students = [student_map["aarav"], student_map["priya"], student_map["rahul"]]
        past_dates = [date(2025, 9, 1) + timedelta(days=i) for i in range(1, 10)]
        for d in past_dates:
            if d.weekday() < 5:  # Weekdays only
                session_exist = db.query(AttendanceSession).filter(
                    AttendanceSession.subject_allocation_id == alloc_map["CS101_A"].id,
                    AttendanceSession.session_date == d
                ).first()
                if not session_exist:
                    session_exist = AttendanceSession(
                        subject_allocation_id=alloc_map["CS101_A"].id,
                        session_date=d,
                        start_time=time(9, 0),
                        end_time=time(10, 0),
                        topic_covered=f"Lecture {d.day}: Advanced Tree Structures & Algorithm Analysis",
                        taken_by_faculty_id=fac_map["riya"].id
                    )
                    db.add(session_exist)
                    db.commit()
                    db.refresh(session_exist)

                    for idx, stu in enumerate(sec_a_students):
                        # Realistic 90% attendance pattern
                        status_att = AttendanceStatus.PRESENT if (idx + d.day) % 7 != 0 else AttendanceStatus.ABSENT
                        db.add(AttendanceRecord(
                            attendance_session_id=session_exist.id,
                            student_id=stu.id,
                            status=status_att
                        ))
                    db.commit()
        print("[OK] Seeded 10 Attendance Lecture Sessions with Attendance Roster")

        # 14. Examination, Schedules & Evaluated Marks
        exam = db.query(Exam).filter(Exam.name == "Mid-Term Examination Fall 2025").first()
        if not exam:
            exam = Exam(
                academic_session_id=session.id,
                semester_id=sem1_cse.id,
                name="Mid-Term Examination Fall 2025",
                exam_type=ExamType.MID_TERM,
                status=ExamStatus.PUBLISHED,
                start_date=date(2025, 10, 15),
                end_date=date(2025, 10, 25),
                is_published=True,
                description="Official mid-semester theoretical and laboratory evaluations."
            )
            db.add(exam)
            db.commit()
            db.refresh(exam)

            # Schedule Papers
            sch_cs101 = ExamSchedule(exam_id=exam.id, subject_id=sub_map["CS101"].id, exam_date=date(2025, 10, 16), start_time=time(10, 0), end_time=time(13, 0), max_marks=100, passing_marks=40, room_number="LH-101")
            sch_cs102 = ExamSchedule(exam_id=exam.id, subject_id=sub_map["CS102"].id, exam_date=date(2025, 10, 18), start_time=time(10, 0), end_time=time(13, 0), max_marks=100, passing_marks=40, room_number="LH-101")
            sch_ec101 = ExamSchedule(exam_id=exam.id, subject_id=sub_map["EC101"].id, exam_date=date(2025, 10, 20), start_time=time(10, 0), end_time=time(13, 0), max_marks=100, passing_marks=40, room_number="LH-102")
            db.add_all([sch_cs101, sch_cs102, sch_ec101])
            db.commit()
            db.refresh(sch_cs101)
            db.refresh(sch_cs102)
            db.refresh(sch_ec101)

            # Enter Evaluated Student Marks
            # Aarav Sharma: 95, 92, 88 -> All A+ / A
            db.add(Mark(exam_schedule_id=sch_cs101.id, student_id=student_map["aarav"].id, marks_obtained=95.0, grade="A+", grade_point=10.0, is_finalized=True, uploaded_by_faculty_id=fac_map["riya"].id))
            db.add(Mark(exam_schedule_id=sch_cs102.id, student_id=student_map["aarav"].id, marks_obtained=92.0, grade="A+", grade_point=10.0, is_finalized=True, uploaded_by_faculty_id=fac_map["sonu"].id))
            db.add(Mark(exam_schedule_id=sch_ec101.id, student_id=student_map["aarav"].id, marks_obtained=88.0, grade="A", grade_point=9.0, is_finalized=True, uploaded_by_faculty_id=fac_map["niraj"].id))

            # Priya Patel: 88, 96, 84
            db.add(Mark(exam_schedule_id=sch_cs101.id, student_id=student_map["priya"].id, marks_obtained=88.0, grade="A", grade_point=9.0, is_finalized=True, uploaded_by_faculty_id=fac_map["riya"].id))
            db.add(Mark(exam_schedule_id=sch_cs102.id, student_id=student_map["priya"].id, marks_obtained=96.0, grade="A+", grade_point=10.0, is_finalized=True, uploaded_by_faculty_id=fac_map["sonu"].id))
            db.add(Mark(exam_schedule_id=sch_ec101.id, student_id=student_map["priya"].id, marks_obtained=84.0, grade="A", grade_point=9.0, is_finalized=True, uploaded_by_faculty_id=fac_map["niraj"].id))

            # Rahul Verma: 82, 85, 80
            db.add(Mark(exam_schedule_id=sch_cs101.id, student_id=student_map["rahul"].id, marks_obtained=82.0, grade="A", grade_point=8.5, is_finalized=True, uploaded_by_faculty_id=fac_map["riya"].id))
            db.add(Mark(exam_schedule_id=sch_cs102.id, student_id=student_map["rahul"].id, marks_obtained=85.0, grade="A", grade_point=8.8, is_finalized=True, uploaded_by_faculty_id=fac_map["sonu"].id))
            db.add(Mark(exam_schedule_id=sch_ec101.id, student_id=student_map["rahul"].id, marks_obtained=80.0, grade="B+", grade_point=8.0, is_finalized=True, uploaded_by_faculty_id=fac_map["niraj"].id))

            db.commit()
            print("[OK] Seeded Published Examination with Finalized Student Marks & SGPA Transcripts")

        # 15. Coursework & Assignments
        asg1 = db.query(Assignment).filter(Assignment.title == "Lab Project 1: Self-Balancing AVL Trees").first()
        if not asg1:
            asg1 = Assignment(
                subject_allocation_id=alloc_map["CS101_A"].id,
                title="Lab Project 1: Self-Balancing AVL Trees",
                description="Implement an AVL tree dictionary with height balancing and rotational benchmarks.",
                instructions="Package your implementation with test drivers into a single archive.",
                due_date=datetime.utcnow() + timedelta(days=7),
                max_points=50,
                status=AssignmentStatus.PUBLISHED,
                allow_late_submission=True,
                max_attempts=2
            )
            db.add(asg1)
            db.commit()
            db.refresh(asg1)

            # Submissions
            sub1 = AssignmentSubmission(
                assignment_id=asg1.id,
                student_id=student_map["aarav"].id,
                attempt_number=1,
                submission_text="Implemented self-balancing AVL Tree in Python with O(log n) performance verified.",
                file_name="aarav_avl_project.zip",
                status=SubmissionStatus.GRADED,
                submitted_at=datetime.utcnow() - timedelta(days=1),
                obtained_marks=49.0,
                feedback="Exemplary algorithmic proofs and clean structure.",
                graded_by_faculty_id=fac_map["riya"].id,
                graded_at=datetime.utcnow()
            )
            db.add(sub1)
            db.commit()
            print("[OK] Seeded Active Coursework Assignments & Graded Submissions")

        # 16. Notices & Circulars
        notices_seed = [
            {
                "title": "Mid-Semester Examination Schedule Fall 2025",
                "summary": "Official examination dates and room allocations have been published.",
                "content": "The midterm examination timetable is now active. All Quantum University students must bring valid digital ID cards.",
                "notice_type": NoticeType.EXAMINATION,
                "priority": NoticePriority.HIGH,
                "target_type": NoticeTargetType.ALL,
                "is_pinned": True,
            },
            {
                "title": "Annual Quantum AI & Tech Hackathon 2025 Registration Open",
                "summary": "Compete in the 48-hour competitive coding and AI challenge.",
                "content": "Computer Science and Engineering students are invited to register teams of up to 4 members. Prizes include sponsored tech hardware and internships.",
                "notice_type": NoticeType.EVENT,
                "priority": NoticePriority.NORMAL,
                "target_type": NoticeTargetType.DEPARTMENT,
                "department_id": dept_map["CSE"].id,
                "is_pinned": False,
            },
            {
                "title": "Quantum University Campus Closed on Friday for National Foundation Day",
                "summary": "All administrative offices, lectures, and laboratories will remain closed.",
                "content": "In observance of the national foundation day, regular academic and administrative activities are suspended for this Friday.",
                "notice_type": NoticeType.HOLIDAY,
                "priority": NoticePriority.URGENT,
                "target_type": NoticeTargetType.ALL,
                "is_pinned": True,
            },
        ]
        for n_data in notices_seed:
            exist_n = db.query(Notice).filter(Notice.title == n_data["title"]).first()
            if not exist_n:
                exist_n = Notice(
                    title=n_data["title"],
                    summary=n_data["summary"],
                    content=n_data["content"],
                    notice_type=n_data["notice_type"],
                    priority=n_data["priority"],
                    status=NoticeStatus.PUBLISHED,
                    target_type=n_data["target_type"],
                    department_id=n_data.get("department_id"),
                    is_pinned=n_data["is_pinned"],
                    publish_at=datetime.utcnow()
                )
                db.add(exist_n)
                db.commit()
        print("[OK] Seeded Campus Announcements & Circulars")

        print("=" * 60)
        print("Quantum University ERP Dataset Population Successfully Completed!")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
