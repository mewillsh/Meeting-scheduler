const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const meetingScheduler = require('./services/meetingScheduler');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Root route for backend server
app.get('/', (req, res) => {
  res.json({
    message: 'Meeting Scheduler API Server',
    status: 'Running',
    endpoints: {
      auth: '/api/auth (POST /login, POST /signup)',
      meetings: '/api/meetings (GET, POST)'
    },
    frontend: 'Access the application at http://localhost:5174',
    features: ['Email Notifications', 'Automatic Reminders', 'Meeting Management']
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/meetings', require('./routes/meetings'));

// Catch-all route for debugging 404 errors
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found', 
    method: req.method, 
    url: req.originalUrl,
    availableRoutes: ['/api/auth/login', '/api/auth/signup', '/api/meetings']
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(5000, () => {
      console.log('Server running on port 5000');
      // Start the meeting reminder scheduler
      meetingScheduler.startScheduler();
    });
  })
  .catch(err => console.error(err));
