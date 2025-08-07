# Meeting Scheduler

A full-stack meeting scheduler application built with React and Express.js.

## Features

- User authentication (signup/login)
- Create and manage meetings
- Email notifications for meeting invitations
- Responsive UI design
- JWT-based authentication

## Tech Stack

**Frontend:**
- React 19
- React Router DOM
- Axios
- Vite

**Backend:**
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer for email notifications
- bcryptjs for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Gmail account for email notifications

### 1. Clone and Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `server` directory with the following variables:

```env
MONGO_URI=mongodb://localhost:27017/meeting-scheduler
JWT_SECRET=your_super_secret_jwt_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

**Email Setup:**
1. Enable 2FA on your Gmail account
2. Generate an App Password: Google Account > Security > 2-Step Verification > App passwords
3. Use the generated app password in `EMAIL_PASS`

### 3. Database Setup

**Option A: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Use: `MONGO_URI=mongodb://localhost:27017/meeting-scheduler`

**Option B: MongoDB Atlas**
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Replace `MONGO_URI` with your Atlas connection string

### 4. Run the Application

**Development Mode:**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

**Production Mode:**
```bash
cd client
npm run build

cd ../server
npm start
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Meetings
- `POST /api/meetings` - Create a new meeting (authenticated)
- `GET /api/meetings` - Get user's meetings (authenticated)

## Usage

1. **Sign Up**: Create a new account with name, email, and password
2. **Login**: Sign in with your credentials
3. **Create Meetings**: Fill out the meeting form with:
   - Title and description
   - Start and end times
   - Participant email addresses (comma-separated)
4. **View Meetings**: See all your created meetings on the dashboard
5. **Email Notifications**: Participants automatically receive email invitations

## Project Structure

```
meeting-scheduler/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # Auth context
│   │   └── ...
│   └── package.json
└── server/                 # Express backend
    ├── middleware/         # Auth middleware
    ├── models/            # MongoDB models
    ├── routes/            # API routes
    ├── utils/             # Utility functions
    └── package.json
```

## Next Steps & Enhancements

- [ ] Calendar view integration
- [ ] Meeting editing and deletion
- [ ] Real-time notifications
- [ ] Meeting reminders
- [ ] Time zone support
- [ ] Recurring meetings
- [ ] Meeting analytics
- [ ] Video call integration

## Troubleshooting

**Common Issues:**

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string format
   - Verify network access for Atlas

2. **Email Not Sending**
   - Verify Gmail app password
   - Check 2FA is enabled
   - Ensure correct email credentials

3. **Frontend API Errors**
   - Confirm backend is running on port 5000
   - Check proxy configuration in vite.config.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
