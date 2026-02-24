@echo off
REM ITPM Study Support Platform - Start Both Servers
REM This script starts both backend and frontend servers

echo.
echo ===============================================
echo  ITPM Study Support Platform
echo  Starting Backend and Frontend Servers
echo ===============================================
echo.

REM Start Backend in a new window
echo Starting Backend Server on port 5000...
start cmd /k "cd /d c:\Users\ASUS\Desktop\ITPM Project\backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start Frontend in a new window
echo Starting Frontend Server on port 3000...
start cmd /k "cd /d c:\Users\ASUS\Desktop\ITPM Project\frontend && npm start"

echo.
echo ===============================================
echo  Servers Starting!
echo ===============================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Close the new command windows to stop the servers.
echo.
pause
