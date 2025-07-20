@echo off
echo Starting servers...

:: Start Flask server in a new window
start cmd /k "cd Server && python app.py"

:: Start Django server in a new window
start cmd /k "cd Server && python manage.py runserver"

:: Start React client in a new window
start cmd /k "cd Client && npm run dev"

echo All servers are starting...
echo Flask server will be available at: http://localhost:5000
echo React client will be available at: http://localhost:5173
echo Django server will be available at: http://localhost:8000

echo Waiting for servers to start...
timeout /t 5
echo Servers should be ready now! 