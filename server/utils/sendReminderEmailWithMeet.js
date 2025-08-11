const nodemailer = require('nodemailer');
const googleMeet = require('./googleMeet');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const formatTimeRemaining = (timeType) => {
  switch(timeType) {
    case 'oneDayBefore': return '24 hours';
    case 'oneHourBefore': return '1 hour';
    case 'fifteenMinsBefore': return '15 minutes';
    default: return '';
  }
};

const generateReminderSubject = (meeting, timeType) => {
  const timeRemaining = formatTimeRemaining(timeType);
  return `🔔 Reminder: "${meeting.title}" starts in ${timeRemaining}`;
};

const generateReminderBody = (meeting, timeType) => {
  const timeRemaining = formatTimeRemaining(timeType);
  const startTime = new Date(meeting.startTime).toLocaleString();
  const endTime = new Date(meeting.endTime).toLocaleString();

  return `
🔔 MEETING REMINDER

Your meeting "${meeting.title}" is starting in ${timeRemaining}!

📅 Meeting Details:
• Title: ${meeting.title}
• Description: ${meeting.description || 'No description provided'}
• Start Time: ${startTime}
• End Time: ${endTime}
• Duration: ${Math.round((new Date(meeting.endTime) - new Date(meeting.startTime)) / (1000 * 60))} minutes

🎥 Join Google Meet:
${meeting.googleMeetLink || 'Meeting link not available'}

⏰ Don't forget to join the meeting!

${timeType === 'fifteenMinsBefore' ? '🚨 This is your final reminder - the meeting starts very soon!' : ''}

Have a productive meeting! 🎯
  `.trim();
};

const generateReminderHtml = (meeting, timeType) => {
  const timeRemaining = formatTimeRemaining(timeType);
  const startTime = new Date(meeting.startTime).toLocaleString();
  const endTime = new Date(meeting.endTime).toLocaleString();
  const duration = Math.round((new Date(meeting.endTime) - new Date(meeting.startTime)) / (1000 * 60));
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ff9800; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .meet-button { 
      display: inline-block; 
      background: #34a853; 
      color: white; 
      padding: 15px 30px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin: 15px 0;
      font-size: 16px;
      font-weight: bold;
    }
    .details { background: white; padding: 15px; border-radius: 4px; margin: 10px 0; }
    .urgent { background: #f44336; color: white; padding: 10px; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🔔 Meeting Reminder</h2>
      <h3>Starting in ${timeRemaining}</h3>
    </div>
    <div class="content">
      <div class="details">
        <h3>${meeting.title}</h3>
        <p><strong>📍 When:</strong> ${startTime} - ${endTime}</p>
        <p><strong>⏱️ Duration:</strong> ${duration} minutes</p>
        <p><strong>📝 Description:</strong> ${meeting.description || 'No description provided'}</p>
      </div>
      
      ${meeting.googleMeetLink ? `
      <div style="text-align: center;">
        <p><strong>Ready to join?</strong></p>
        <a href="${meeting.googleMeetLink}" class="meet-button">🎥 Join Google Meet Now</a>
      </div>
      ` : ''}
      
      ${timeType === 'fifteenMinsBefore' ? `
      <div class="urgent">
        <strong>🚨 FINAL REMINDER - Meeting starts very soon!</strong>
      </div>
      ` : ''}
      
      <hr>
      <p><small>This reminder was sent by Meeting Scheduler App</small></p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

module.exports = async function sendReminderEmail(recipients, meeting, timeType) {
  try {
    const subject = generateReminderSubject(meeting, timeType);
    const text = generateReminderBody(meeting, timeType);
    const html = generateReminderHtml(meeting, timeType);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(','),
      subject: subject,
      text: text,
      html: html
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder email sent for meeting "${meeting.title}" (${timeType})`);
  } catch (error) {
    console.error(`❌ Failed to send reminder email for meeting "${meeting.title}":`, error.message);
    throw error;
  }
};
