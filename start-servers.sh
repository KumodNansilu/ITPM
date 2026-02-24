#!/bin/bash

# ITPM Study Support Platform - Start Both Servers (Mac/Linux)

echo ""
echo "==============================================="
echo "  ITPM Study Support Platform"
echo "  Starting Backend and Frontend Servers"
echo "==============================================="
echo ""

# Start Backend
echo "Starting Backend Server on port 5000..."
cd "c:\Users\ASUS\Desktop\ITPM Project\backend"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
echo "Starting Frontend Server on port 3000..."
cd "c:\Users\ASUS\Desktop\ITPM Project\frontend"
npm start &
FRONTEND_PID=$!

echo ""
echo "==============================================="
echo "  Servers Starting!"
echo "==============================================="
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop all servers, run:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Wait for all background processes
wait
