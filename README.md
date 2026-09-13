
# Email Verification Auth

React + Django authentication with email verification and password reset.

## Features

- Signup with 6-digit email verification code
- Login with JWT (access + refresh)
- Forgot password — 2-step flow (verify code → set new password)
- Change password from dashboard
- Protected routes (React Router)
- Custom password validator
- CORS + email via console/SMTP

## Stack

- **Backend:** Django 6.1, DRF, SimpleJWT, django-cors-headers
- **Frontend:** React, Vite, React Router
- **DB:** SQLite (dev)

## Setup

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # then edit as needed
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

cd frontend
npm install
npm run dev

Open http://localhost:5173