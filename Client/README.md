# Client: Audio Speech To Sign Language Converter (Frontend)

This is the React frontend for the Audio Speech To Sign Language Converter web application. It provides a modern, responsive UI for converting live speech or typed text into Indian Sign Language (ISL) animations.

## Features
- **Live Speech Recognition:** Uses the browser's Web Speech API to convert spoken English to text.
- **Text-to-Sign Animation:** Sends recognized or manually entered text to the backend and plays corresponding ISL animation videos.
- **Authentication:** Sign up, sign in, and protected routes using JWT tokens.
- **Routing:** React Router for navigation (SignIn, SignUp, MainScreen, ReplyPage).
- **Internationalization:** i18next support for future language expansion.
- **Modern UI:** Built with React 19, React Icons, and custom CSS.

## Project Structure
- `src/components/` — MainScreen, ReplyPage, Auth (SignIn, SignUp)
- `src/context/LanguageContext.jsx` — Language context for i18n
- `src/App.jsx` — Main app logic, routing, authentication

## Getting Started

### Prerequisites
- Node.js >= 18
- Backend server running (see ../Server/README.md)

### Install dependencies
```sh
cd Client
npm install
```

### Run the development server
```sh
npm run dev
```
The app will be available at http://localhost:5173

### Build for production
```sh
npm run build
```

## Environment & API
- Expects backend Flask API at http://localhost:5000 and Django at http://localhost:8000
- Animation videos are fetched from `/static/` on the backend

## Usage
1. Sign up or sign in
2. Use the mic button to record speech, or type text manually
3. Submit to see ISL animation videos for each word/phrase

---
See [../README.md](../README.md) for a high-level project overview.
