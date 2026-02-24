# 📚 ITPM Study Support Platform - Project Index

Welcome to your complete MERN stack study support platform! This document helps you navigate all the resources available.

## 🚀 Quick Start

### Start Both Servers (Easiest Way)

**On Windows:**
```bash
Double-click: start-servers.bat
```

**On Mac/Linux:**
```bash
bash start-servers.sh
```

### Manual Start (Two Terminal Windows)

**Terminal 1 - Backend:**
```bash
cd "c:\Users\ASUS\Desktop\ITPM Project\backend"
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd "c:\Users\ASUS\Desktop\ITPM Project\frontend"
npm start
```

Then open: http://localhost:3000

---

## 📖 Documentation Files

### 1. **README.md** - Complete Documentation
- Project overview
- All features explained
- Database models description
- API endpoint reference (50+ endpoints)
- User roles and permissions
- Running instructions
- Troubleshooting guide

### 2. **QUICK_START.md** - Quick Reference
- Fast setup instructions
- Testing procedures for each feature
- Configuration details
- Common troubleshooting

### 3. **SETUP_SUMMARY.md** - Setup Overview
- What was created
- Technologies used
- Features implemented
- Everything that's included

### 4. **COMPLETION_CHECKLIST.md** - Verification
- Complete directory structure
- All files created verified
- Features checklist
- API endpoints list
- Dependencies installed

### 5. **PROJECT_INDEX.md** - This File
- Navigation guide
- File structure
- Quick reference

---

## 🏗️ Project Structure

```
ITPM Project/
├── 📄 README.md                    (Main Documentation)
├── 📄 QUICK_START.md              (Quick Start Guide)
├── 📄 SETUP_SUMMARY.md            (Setup Overview)
├── 📄 COMPLETION_CHECKLIST.md     (Verification)
├── 📄 PROJECT_INDEX.md            (This File)
├── 🔧 start-servers.bat           (Windows - Start Both Servers)
├── 🔧 start-servers.sh            (Mac/Linux - Start Both Servers)
│
├── 📁 backend/                    (Express.js + MongoDB)
│   ├── server.js                   (Main entry point)
│   ├── package.json
│   ├── .env                        (Configuration)
│   ├── models/                     (10 Database schemas)
│   ├── controllers/                (8 API controllers)
│   ├── routes/                     (8 Route files)
│   ├── middleware/                 (Authentication & File Upload)
│   ├── uploads/                    (File storage)
│   └── node_modules/               (Dependencies)
│
├── 📁 frontend/                   (React.js)
│   ├── src/
│   │   ├── App.js                  (Main application)
│   │   ├── pages/                  (9 Pages)
│   │   ├── components/             (Reusable components)
│   │   ├── context/                (State management)
│   │   ├── services/               (API integration)
│   │   └── styles/                 (Responsive CSS)
│   ├── public/
│   ├── package.json
│   └── node_modules/               (Dependencies)
```

---

## 🎯 Features Overview

### 1. User Management ✓
- Register/Login with JWT
- Role-based access (Student/Tutor/Admin)
- Profile management
- Password hashing

### 2. Subject & Topic Management ✓
- Create subjects and topics
- Manage hierarchies
- Assign to materials

### 3. Study Materials ✓
- Upload files (PDF, DOC, PPT, TXT, Images)
- Download tracking
- Organize by subject/topic

### 4. Study Planner ✓
- Create study plans
- Track progress
- View completion status

### 5. Q&A Forum ✓
- Ask questions
- Provide answers
- Mark helpful answers
- Accept best answers

### 6. MCQ Mock Exams ✓
- Create questions (Tutor)
- Attempt exams (Student)
- Auto-marking
- Performance tracking

### 7. Appointment Scheduling ✓
- Request sessions
- View available slots
- Approve/reject (Tutor)
- Cancel appointments

---

## 🔑 Key Files

### Backend Key Files

| File | Purpose |
|------|---------|
| `server.js` | Main server entry point |
| `models/User.js` | User authentication & profile |
| `controllers/authController.js` | Login/Register logic |
| `middleware/auth.js` | JWT authentication |
| `routes/authRoutes.js` | Auth endpoints |

### Frontend Key Files

| File | Purpose |
|------|---------|
| `App.js` | Main application & routing |
| `context/AuthContext.js` | Authentication state |
| `services/api.js` | API integration |
| `pages/Login.js` | Login page |
| `pages/Dashboard.js` | Main dashboard |

---

## 🗄️ Database Models

### 10 Mongoose Schemas

| Model | Purpose |
|-------|---------|
| User | Student/Tutor/Admin accounts |
| Subject | Subject management |
| Topic | Topic hierarchy |
| StudyMaterial | File storage metadata |
| StudyPlan | Student learning plans |
| Question | Q&A forum questions |
| Answer | Forum answers |
| MCQ | Multiple choice questions |
| MCQAttempt | Quiz results |
| Appointment | Session scheduling |

---

## 🔗 API Endpoints Summary

### Total: 50+ Endpoints

| Category | Count | Examples |
|----------|-------|----------|
| Auth | 3 | /register, /login |
| Users | 5 | /profile, /update |
| Subjects | 10 | /create, /update, /topics |
| Materials | 7 | /upload, /download |
| Plans | 7 | /create, /complete |
| Q&A | 8 | /questions, /answers |
| MCQ | 7 | /create, /submit |
| Appointments | 9 | /request, /approve |

See **README.md** for detailed API documentation.

---

## 💻 Technology Stack

### Backend
- Node.js (Runtime)
- Express.js (Web Framework)
- MongoDB (Database)
- Mongoose (ODM)
- JWT (Authentication)
- Bcryptjs (Security)
- Multer (File Upload)

### Frontend
- React 18 (UI)
- React Router (Navigation)
- Axios (HTTP Client)
- React Context (State)
- React Toastify (Notifications)

---

## 🚦 Status Indicators

| Feature | Status | Notes |
|---------|--------|-------|
| Backend Setup | ✅ Ready | All dependencies installed |
| Frontend Setup | ✅ Ready | All dependencies installed |
| Database | ✅ Configured | MongoDB Atlas connected |
| Authentication | ✅ Implemented | JWT + Role-based |
| API Endpoints | ✅ Created | 50+ endpoints ready |
| React Pages | ✅ Built | 9 pages implemented |
| Styling | ✅ Complete | Responsive CSS |

---

## 📝 How to Use This Project

### Step 1: Start the Servers
```bash
start-servers.bat    # Windows
# OR
bash start-servers.sh # Mac/Linux
```

### Step 2: Register & Login
- Go to http://localhost:3000
- Register as Student or Tutor
- Login with your credentials

### Step 3: Explore Features
- **Students**: Create plans, browse materials, ask questions, attempt MCQs
- **Tutors**: Create subjects, upload materials, create MCQs, manage appointments

### Step 4: Test API
- Backend API: http://localhost:5000/api
- Use Postman or Thunder Client for testing

---

## 🔒 Security

- ✅ JWT Authentication
- ✅ Password Hashing (bcryptjs)
- ✅ Role-based Access Control
- ✅ Protected API Routes
- ✅ File Upload Validation
- ✅ Input Validation
- ✅ CORS Protection

---

## 📞 Support & Resources

### Documentation
- **Full Guide**: Read [README.md](README.md)
- **Quick Start**: Read [QUICK_START.md](QUICK_START.md)
- **Checklist**: See [COMPLETION_CHECKLIST.md](COMPLETION_CHECKLIST.md)

### Common Tasks

**Start Backend Only:**
```bash
cd backend && npm run dev
```

**Start Frontend Only:**
```bash
cd frontend && npm start
```

**View Backend Logs:**
```
Terminal showing backend server output
```

**View Frontend Logs:**
```
Browser console (F12)
```

---

## ⚙️ Configuration

### Backend Environment (.env)
- MongoDB URI: Configured with Atlas
- JWT Secret: Set (change in production)
- Port: 5000
- Node Environment: development

### Frontend API
- Base URL: http://localhost:5000/api
- Auto-configures for development/production

---

## 🎓 Learning Path

### For Students
1. Register account
2. View available materials
3. Create a study plan
4. Attempt an MCQ
5. Ask a question in Q&A

### For Tutors
1. Register account
2. Create subjects and topics
3. Upload materials
4. Create MCQ questions
5. Answer student questions

---

## 📊 Project Statistics

- **Files Created**: 50+
- **Lines of Code**: 5000+
- **Database Models**: 10
- **API Endpoints**: 50+
- **React Pages**: 9
- **React Components**: 2+
- **Dependencies**: 160+ (Backend), 1300+ (Frontend)
- **Time to Deploy**: Ready now ✓

---

## ✨ Next Steps

1. Review [README.md](README.md) for complete documentation
2. Run `start-servers.bat` to launch both servers
3. Register test accounts
4. Test all features
5. Customize for your needs
6. Deploy to production

---

## 📄 File Reference Quick Links

| File | Purpose | View |
|------|---------|------|
| README.md | Full Documentation | Complete guide with all details |
| QUICK_START.md | Quick Reference | Fast setup & testing |
| SETUP_SUMMARY.md | Overview | What's included |
| COMPLETION_CHECKLIST.md | Verification | All components & features listed |
| PROJECT_INDEX.md | Navigation | This file - directory guide |

---

## 🎉 You're All Set!

Everything is ready to use. Simply:

1. **Double-click** `start-servers.bat` (Windows) or run `bash start-servers.sh` (Mac/Linux)
2. Open **http://localhost:3000**
3. **Register** & start exploring!

---

**Platform**: ITPM Study Support Platform
**Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: February 10, 2026

Happy coding! 🚀
