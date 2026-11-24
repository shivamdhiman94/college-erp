# College ERP System — API Reference & Endpoints

All endpoints are mounted under `/api/v1` and protected by OAuth2 Bearer JWT authorization.

---

## 1. Authentication (`/api/v1/auth`)

| Method | Route | Description | Roles Allowed |
|---|---|---|---|
| `POST` | `/auth/login` | Authenticate with username/email & password, returns JWT tokens. | Public |
| `POST` | `/auth/refresh` | Issue new access token using refresh token. | Public |
| `GET` | `/auth/me` | Retrieve profile and role of authenticated user. | Authenticated |
| `POST` | `/auth/change-password` | Update account password. | Authenticated |

---

## 2. Academic Hierarchy (`/api/v1`)

| Method | Route | Description | Roles Allowed |
|---|---|---|---|
| `GET/POST` | `/departments` | List / Create Academic Departments | `ADMIN` (Write) / All (Read) |
| `GET/POST` | `/courses` | List / Create Degree Courses | `ADMIN` (Write) / All (Read) |
| `GET/POST` | `/sessions` | List / Create Academic Sessions | `ADMIN` (Write) / All (Read) |
| `GET/POST` | `/semesters` | List / Create Semesters | `ADMIN` (Write) / All (Read) |
| `GET/POST` | `/sections` | List / Create Classroom Sections | `ADMIN` (Write) / All (Read) |
| `GET/POST` | `/subjects` | List / Create Curriculum Subjects | `ADMIN` (Write) / All (Read) |
| `GET/POST` | `/allocations` | Assign Subjects to Faculty | `ADMIN` (Write) / All (Read) |
| `GET` | `/allocations/my-allocations`| Get assigned subjects for logged-in faculty | `FACULTY`, `ADMIN` |

---

## 3. Student & Faculty Management (`/api/v1`)

| Method | Route | Description | Roles Allowed |
|---|---|---|---|
| `GET/POST` | `/students` | List / Admit new students | `ADMIN` |
| `GET/PUT/DELETE`| `/students/{id}` | Student record details, edit, deactivate | `ADMIN` |
| `GET` | `/students/me/profile` | Logged-in student's verified profile | `STUDENT`, `ADMIN` |
| `GET/POST` | `/faculty` | List / Register faculty members | `ADMIN` |
| `GET/PUT/DELETE`| `/faculty/{id}` | Faculty profile details, edit, deactivate | `ADMIN` |
| `GET` | `/faculty/me/profile` | Logged-in faculty profile & designations | `FACULTY`, `ADMIN` |

---

## 4. Attendance Management (`/api/v1/attendance`)

| Method | Route | Description | Roles Allowed |
|---|---|---|---|
| `GET` | `/attendance/students-for-allocation/{id}` | Load student roster for an allocation date | `FACULTY`, `ADMIN` |
| `POST` | `/attendance/sessions` | Record or update daily attendance session | `FACULTY`, `ADMIN` |
| `GET` | `/attendance/my-attendance` | Student personal attendance statistics & 75% gauge | `STUDENT`, `ADMIN` |
| `GET` | `/attendance/allocation/{id}/report` | Section attendance rate aggregation | `FACULTY`, `ADMIN` |

---

## 5. Timetable & Rooms (`/api/v1`)

| Method | Route | Description | Roles Allowed |
|---|---|---|---|
| `GET/POST` | `/rooms` | Physical room catalog management | `ADMIN` (Write) / All (Read) |
| `GET/POST` | `/timetable` | Lecture timetable slots with conflict engine | `ADMIN` (Write) / All (Read) |
| `GET` | `/timetable/student/my-schedule` | Student weekly section timetable | `STUDENT`, `ADMIN` |
| `GET` | `/timetable/faculty/my-schedule` | Faculty weekly teaching timetable | `FACULTY`, `ADMIN` |

---

## 6. Examinations & Marks (`/api/v1`)

| Method | Route | Description | Roles Allowed |
|---|---|---|---|
| `GET/POST` | `/exams` | List / Create Examination sessions | `ADMIN` (Write) / All (Read) |
| `POST` | `/exams/{id}/publish` | Publish official exam results | `ADMIN` |
| `POST` | `/exams/{id}/schedules` | Schedule subject exam papers & weightages | `ADMIN` |
| `GET` | `/marks/students-for-schedule/{id}` | Load roster for marks entry | `FACULTY`, `ADMIN` |
| `POST` | `/marks/bulk-save` | Submit / Finalize student marks | `FACULTY`, `ADMIN` |
| `GET` | `/marks/my-results` | Student published report cards & SGPA score | `STUDENT`, `ADMIN` |
| `GET` | `/marks/grades-scale` | Institutional grading scale reference (`A+` to `F`) | Authenticated |

---

## 7. Assignments & Coursework (`/api/v1/assignments`)

| Method | Route | Description | Roles Allowed |
|---|---|---|---|
| `GET/POST` | `/assignments` | List / Create homework assignments | `FACULTY`, `ADMIN` |
| `GET` | `/assignments/student/my-assignments` | Logged-in student's coursework agenda | `STUDENT`, `ADMIN` |
| `POST` | `/assignments/{id}/submit` | Student turns in solution | `STUDENT`, `ADMIN` |
| `GET` | `/assignments/{id}/submissions` | Faculty reviews student submissions | `FACULTY`, `ADMIN` |
| `POST` | `/assignments/submissions/{id}/grade` | Faculty grades submission with feedback | `FACULTY`, `ADMIN` |
| `GET` | `/assignments/{id}/statistics` | Assignment submission & scoring metrics | `FACULTY`, `ADMIN` |

---

## 8. Notice & Announcement Board (`/api/v1/notices`)

| Method | Route | Description | Roles Allowed |
|---|---|---|---|
| `GET/POST` | `/notices` | List targeted notices / Broadcast circular | `ADMIN`, `FACULTY` (Write) / All |
| `POST` | `/notices/{id}/pin` & `/unpin` | Sticky notice controls | `ADMIN` |
| `POST` | `/notices/{id}/read` | Mark individual notice as read | Authenticated |
| `POST` | `/notices/mark-all-read` | Mark all applicable notices as read | Authenticated |
| `GET` | `/notices/unread-count` | Real-time unread notice count | Authenticated |
| `GET` | `/notices/statistics` | Executive notice metrics | `ADMIN` |
