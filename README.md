# Audio Speech To Sign Language Converter

A full-stack web application that converts live audio speech to text and displays the corresponding Indian Sign Language (ISL) animations.

- **Frontend:** React + Vite (Client/)
- **Backend:** Django + Flask (Server/)
- **Sign Language Animations:** 3D avatar videos for ISL words/phrases

## Features
- Live speech-to-text using browser Web Speech API
- Text-to-sign translation with 3D avatar animations
- User authentication (sign up, login)
- Manual text input supported
- Responsive, modern UI
- ~130+ ISL animation videos

## Architecture
- **Client:** React SPA, handles authentication, speech input, and animation playback
- **Server:**
  - Django: Serves static files, handles CSRF, and main web endpoints
  - Flask: Handles API endpoints for authentication, text processing, and reply generation
- **Animations:** Served as .mp4 files from the backend static directory

## Quickstart

### 1. Clone the repo
```sh
git clone <repo-url>
cd Audio-Speech-To-Sign-Language-Converter_Webapplication_v0
```

### 2. Start the backend
See [Server/README.md](Server/README.md)

### 3. Start the frontend
See [Client/README.md](Client/README.md)

---

- Project Demo: https://youtu.be/YiHhD0QGrno
- For details on setup, dependencies, and usage, see the respective subproject READMEs.

<img width="1919" height="928" alt="image" src="https://github.com/user-attachments/assets/82eda8b5-37c6-483f-96c5-f2ed8c80f796" /> <img width="1919" height="929" alt="image" src="https://github.com/user-attachments/assets/819c9f90-688e-47d3-9228-13daa0a9346b" />


