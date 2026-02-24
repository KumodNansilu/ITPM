# Quick Start Guide - ITPM Study Support Platform

## 🚀 Launch Instructions

### Step 1: Start the Backend Server

Open a terminal and run:
```bash
cd "c:\Users\ASUS\Desktop\ITPM Project\backend"
npm run dev
```

**Expected output:**
```
Server running on port 5000
MongoDB connected successfully
```

### Step 2: Start the Frontend Server

Open a NEW terminal and run:
```bash
cd "c:\Users\ASUS\Desktop\ITPM Project\frontend"
npm start
```

**Expected output:**
The frontend will automatically open in your browser at `http://localhost:3000`

## 📝 Test Credentials

After registration, you can test the application with:

**Student Account:**
- Email: student@example.com
- Password: password123
- Role: Student

**Tutor Account:**
- Email: tutor@example.com
- Password: password123
- Role: Tutor

## 🧪 Testing the Features

### For Students:

1. **Study Planner** (/study-planner)
   - Create a study plan with a subject, topic, date, and duration
   - Mark plans as completed
   - View learning progress summary

2. **Study Materials** (/materials)
   - Browse available study materials by subject
   - Download materials (PDF, DOC, PPT, etc.)
   - View uploader information and download count

3. **Q&A Forum** (/questions)
   - Ask academic questions
   - View answers from tutors and students
   - Mark helpful answers
   - Accept best answers

4. **MCQ Practice** (/mcq)
   - Attempt multiple-choice questions
   - View detailed feedback and correct answers
   - Check your quiz score and performance

### For Tutors:

1. **Manage Subjects** (/subjects)
   - Create new subjects with code and description
   - Create topics under each subject
   - View and manage all subjects
   - Delete subjects (removes associated topics)

2. **Upload Materials** (/materials/upload)
   - Upload study materials (PDF, DOC, PPT, TXT, Images)
   - Assign materials to subjects and topics
   - Add descriptions and details
   - Max file size: 100MB

3. **Create MCQ** (/mcq/create)
   - Create multiple-choice questions
   - Add options and mark correct answers
   - Add explanations for answers
   - Set difficulty level (Easy, Medium, Hard)

4. **Q&A Forum** (/questions)
   - View and answer student questions
   - Mark answers as accepted
   - Help students learn better

## 🔧 Configuration

### Backend (.env)
Located at: `c:\Users\ASUS\Desktop\ITPM Project\backend\.env`

```env
MONGODB_URI=mongodb+srv://admin_db_user:P56L0y3xPwOUTxgY@cluster0.r3swvct.mongodb.net/itpm_study_platform
PORT=5000
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```

### Frontend API URL
Located at: `c:\Users\ASUS\Desktop\ITPM Project\frontend\src\services\api.js`

Default: `http://localhost:5000/api`

## 📂 Project Structure

```
ITPM Project/
├── backend/
│   ├── models/              # Database schemas
│   │   ├── User.js
│   │   ├── Subject.js
│   │   ├── Topic.js
│   │   ├── StudyMaterial.js
│   │   ├── StudyPlan.js
│   │   ├── Question.js
│   │   ├── Answer.js
│   │   ├── MCQ.js
│   │   ├── MCQAttempt.js
│   │   └── Appointment.js
│   ├── controllers/         # Business logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── subjectController.js
│   │   ├── materialController.js
│   │   ├── planController.js
│   │   ├── questionController.js
│   │   ├── mcqController.js
│   │   └── appointmentController.js
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth & file upload
│   ├── uploads/            # File storage
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/          # Page components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── StudyPlanner.js
│   │   │   ├── Materials.js
│   │   │   ├── Questions.js
│   │   │   ├── MCQ.js
│   │   │   ├── Profile.js
│   │   │   └── SubjectsManagement.js
│   │   ├── components/     # Reusable components
│   │   │   ├── Navigation.js
│   │   │   └── ProtectedRoute.js
│   │   ├── context/        # React Context
│   │   │   └── AuthContext.js
│   │   ├── services/       # API calls
│   │   │   └── api.js
│   │   ├── styles/         # CSS
│   │   │   └── index.css
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🐛 Troubleshooting

### Issue: "Port 5000 is already in use"
```powershell
# Find the process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F
```

### Issue: "Cannot find module"
```bash
# Reinstall node_modules
rm -r node_modules package-lock.json
npm install
```

### Issue: "MongoDB connection error"
- Verify your IP is whitelisted in MongoDB Atlas
- Check your password is correct
- Ensure database name is correct in URI

### Issue: CORS Error
- Ensure backend is running on port 5000
- Check CORS configuration matches your frontend URL

### Issue: File Upload Not Working
- Ensure `uploads/` folder exists in backend directory
- Check file size is under 100MB
- Verify file type is allowed (PDF, DOC, PPT, TXT, Images)

## 🔐 Security Notes

1. Change `JWT_SECRET` in production
2. Use environment variables for sensitive data
3. Enable HTTPS in production
4. Implement rate limiting for API
5. Sanitize user inputs
6. Use HTTPS for database connection

## 📖 API Documentation

See [API Endpoints](#api-endpoints) in the main README for detailed API documentation.

## 🤝 Contributing

For contributions, please ensure:
1. Code follows existing style
2. All features are tested
3. Documentation is updated
4. No sensitive data in commits

## 📞 Support

For issues or questions, refer to the main README.md file.

## ✅ Verification Checklist

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] MongoDB connection working
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Dashboard displays correct role-based content
- [ ] API endpoints responding correctly

---

**Last Updated:** February 10, 2026
