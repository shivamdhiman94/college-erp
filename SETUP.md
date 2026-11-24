# Quantum University ERP System — Installation & Deployment Guide

## Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: 18.x or higher, with npm 9.x+
- **Database**: PostgreSQL 14+ (or bundled SQLite for local development)

---

## Step 1: Clone & Navigate

```bash
cd C:\Users\shiva\.gemini\antigravity\scratch\college-erp
```

---

## Step 2: Backend Setup

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure Environment Variables
cp .env.example .env

# 4. Initialize Database Tables & Seed Demo Dataset
python app/db/seed_demo_data.py

# 5. Run Automated Pytest Suite
.\venv\Scripts\pytest -v

# 6. Start the FastAPI Development Server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

FastAPI OpenAPI Interactive Swagger UI will be available at:
👉 **`http://localhost:8000/docs`**

---

## Step 3: Frontend Setup

```bash
cd ../frontend

# 1. Install Node.js dependencies
npm install

# 2. Verify Production Build
npm run build

# 3. Start Development Server
npm run dev
```

React Web Application will be live at:
👉 **`http://localhost:5173`**

---

## Step 4: Login to the System

Use any of the pre-seeded credentials:
- **Admin**: `shivam` / `shivam@123`
- **Faculty**: `riya` / `riya@123` (or `sonu`, `niraj`, `kartik`)
- **Student**: `aarav` / `aarav@123` (or `priya`, `rahul`, `sneha`, `rohan`)
