<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0-CC2927?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Tests-30%20Passing-brightgreen?style=for-the-badge"/>
</p>

<h1 align="center">🎓 Quantum University ERP System</h1>

<p align="center">
  A modern, production-ready <strong>College Enterprise Resource Planning (ERP)</strong> system built with <strong>FastAPI</strong>, <strong>React 18</strong>, and <strong>Tailwind CSS</strong>.<br/>
  Role-based portal for <strong>Administrators</strong>, <strong>Faculty</strong>, and <strong>Students</strong> — covering the entire academic lifecycle.
</p>

---

## ✨ Features

### 🔐 Authentication & Security
- JWT access + refresh token rotation
- bcrypt password hashing
- Role-based access control (`ADMIN`, `FACULTY`, `STUDENT`)
- Protected API endpoints with OAuth2 Password Bearer

### 🏛️ Academic Hierarchy
- Deep relational structure: **Department → Course → Academic Session → Semester → Section → Subject**
- Full CRUD management from the Admin portal

### 👨‍🎓 Student Management
- Student admissions with unique enrollment codes
- Roll number indexing and academic allocation

### 👨‍🏫 Faculty Management
- Faculty employee profiles, qualifications, and subject allocations

### 📅 Attendance System
- Session-by-session attendance marking
- Live 75% shortage alert engine
- Subject-wise attendance breakdowns

### 🗓️ Timetable & Room Scheduling
- Multi-constraint conflict detection (no overlapping faculty / room / section)
- Day-wise schedule views per student and faculty

### 📝 Examination & Grading
- Exam lifecycle: Draft → Published
- Centralized grading engine (`A+` to `F`)
- Weighted SGPA/CGPA calculation

### 📚 Assignments & Coursework
- Faculty homework publisher with due date countdowns
- Student submission uploads with attempt limits (1–5)
- Late submission penalties and grading feedback

### 📢 Notice Board
- Multi-tier audience targeting (`ALL`, `STUDENTS`, `FACULTY`, `DEPARTMENT`, `COURSE`, `SEMESTER`, `SECTION`)
- Priority alerts (`URGENT`, `HIGH`, `NORMAL`)
- Per-user read/unread tracking

### 📊 Dashboards
- **Student Dashboard**: Modern white/blue portal with attendance ring, today's classes, quick-access cards, results & fees summary
- **Faculty Dashboard**: Subject roster, today's timetable, attendance marking shortcuts
- **Admin Dashboard**: Institution-wide KPIs with Recharts analytics

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 18 + Vite |
| **Frontend Styling** | Tailwind CSS v3 |
| **Frontend Routing** | React Router DOM v6 |
| **HTTP Client** | Axios (with JWT interceptors) |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Backend Framework** | FastAPI (Python 3.11+) |
| **ORM** | SQLAlchemy 2.0 |
| **Database** | PostgreSQL (production) / SQLite (development) |
| **Data Validation** | Pydantic v2 |
| **Authentication** | python-jose (JWT) + Passlib (bcrypt) |
| **DB Migrations** | Alembic |
| **Testing** | Pytest + HTTPX TestClient |

---

## 📁 Folder Structure

```
college-erp/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/v1/             # API route handlers (auth, students, faculty, attendance, ...)
│   │   ├── core/               # Config, security, dependencies
│   │   ├── db/                 # Database session, base, init & seed scripts
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   └── main.py             # FastAPI app entrypoint
│   ├── alembic/                # Database migration scripts
│   ├── tests/                  # Pytest test suite (30 tests)
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment variable template
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # AppLayout, Navbar, Sidebar
│   │   │   ├── student/        # StudentNavbar, StudentSidebar, dashboard widgets
│   │   │   ├── faculty/        # Faculty-specific components
│   │   │   ├── admin/          # Admin-specific components
│   │   │   └── common/         # Shared: Button, Card, Modal, Table, EmptyState...
│   │   ├── context/            # AuthContext
│   │   ├── hooks/              # useAuth, custom hooks
│   │   ├── pages/              # Page components (student/, faculty/, admin/)
│   │   ├── routes/             # AppRoutes, ProtectedRoute
│   │   ├── services/           # Axios API service layer
│   │   └── utils/              # Constants, helpers
│   ├── package.json
│   └── vite.config.js
│
├── API_DOCUMENTATION.md        # Full API reference
├── ARCHITECTURE.md             # System architecture overview
├── DEMO_CREDENTIALS.md         # Demo login credentials
├── SETUP.md                    # Detailed setup guide
└── README.md                   # This file
```

---

## ⚡ Quick Start

### Prerequisites
- **Python** 3.11+
- **Node.js** 18+ and npm
- **PostgreSQL** (or use SQLite for local dev — zero config)

### 1. Clone the repository

```bash
git clone https://github.com/shivamdhiman/college-erp.git
cd college-erp
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and set your DATABASE_URL and SECRET_KEY

# Run database migrations
alembic upgrade head

# Seed demo data
python app/db/seed_demo_data.py

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**  
API Docs: **http://localhost:8000/api/v1/docs**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 👥 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| **Super Admin** | `admin` | `AdminPassword@123` |
| **Faculty** | `knuth` | `FacultyPassword@123` |
| **Faculty** | `dijkstra` | `FacultyPassword@123` |
| **Student** | `adalovelace` | `StudentPassword@123` |
| **Student** | `linustorvalds` | `StudentPassword@123` |
| **Student** | `alanturing` | `StudentPassword@123` |

> See [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) for the full list.

---

## 🧪 Running Tests

```bash
cd backend
.\venv\Scripts\activate        # Windows
source venv/bin/activate       # macOS/Linux

pytest -v
```

**Result**: `30 passed` ✅

---

## 🔧 Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
PROJECT_NAME="Quantum University ERP API"
SECRET_KEY="your-secret-key-min-32-chars"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL="sqlite:///./college_erp.db"   # or PostgreSQL URL
BACKEND_CORS_ORIGINS=["http://localhost:5173"]
```

> ⚠️ **Never commit your `.env` file.** It is excluded by `.gitignore`.

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete REST API reference |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design & architecture |
| [SETUP.md](./SETUP.md) | Detailed installation guide |
| [DEMO_CREDENTIALS.md](./DEMO_CREDENTIALS.md) | All demo login accounts |

---

## 📄 License

This project is for educational and demonstration purposes.

---

<p align="center">Built with ❤️ by <strong>Shivam Dhiman</strong></p>
