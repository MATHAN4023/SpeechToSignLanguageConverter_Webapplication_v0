# Server: Audio Speech To Sign Language Converter (Backend)

This is the backend for the Audio Speech To Sign Language Converter web application. It provides authentication, speech/text processing, and serves Indian Sign Language (ISL) animation videos.

- **Frameworks:** Django (main web server), Flask (API endpoints)
- **NLP:** NLTK for text preprocessing
- **Animations:** 130+ ISL .mp4 videos served from /static/avatar

## Features
- User authentication (sign up, login, JWT)
- Speech/text-to-sign translation API
- Serves 3D avatar ISL animations
- Text preprocessing with NLTK
- CORS support for local frontend dev

## Project Structure
- `A2SL/` — Django project (settings, urls, views)
- `auth_app/` — Django app (models, admin, views)
- `app.py` — Flask API (auth, verify, generate-reply)
- `reply_generator.py` — Text-to-sign logic
- `static/avatar/` — 130+ ISL animation .mp4 files

## Prerequisites
- Python >= 3.7
- MongoDB (for user data)
- Node.js (for frontend, see ../Client/README.md)

## Setup

### 1. Install dependencies
```sh
cd Server
python -m venv venv
venv\Scripts\activate  # On Windows
# or
source venv/bin/activate  # On Mac/Linux
pip install -r requirements.txt
```

### 2. Set environment variables
Create a `.env` file in `Server/` with:
```
MONGODB_URI=mongodb://localhost:27017/a2sl
JWT_SECRET_KEY=your_secret_key
```

### 3. Download NLTK data
```sh
python download_nltk_data.py
```

### 4. Run Django server (static files, CSRF, main web)
```sh
python manage.py runserver 8000
```

### 5. Run Flask API (auth, text processing)
```sh
python app.py
```

## API Endpoints (Flask)
- `POST /api/signup` — Register user
- `POST /api/login` — Login, returns JWT
- `GET /api/verify` — Verify JWT
- `POST /api/generate-reply` — Text-to-sign translation

## Troubleshooting
- Make sure both Django (8000) and Flask (5000) servers are running
- MongoDB must be running and accessible
- For CORS issues, check allowed origins in `app.py`

---
See [../README.md](../README.md) for a high-level project overview.
