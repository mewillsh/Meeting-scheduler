const nodemailer = require('nodemailer');

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
  return `Reminder: "${meeting.title}" starts in ${timeRemaining}`;
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

⏰ Don't forget to join the meeting!

${timeType === 'fifteenMinsBefore' ? '🚨 This is your final reminder - the meeting starts very soon!' : ''}

Have a productive meeting! 🎯
  `.trim();
};

module.exports = async function sendReminderEmail(recipients, meeting, timeType) {
  try {
    const subject = generateReminderSubject(meeting, timeType);
    const text = generateReminderBody(meeting, timeType);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(','),
      subject: subject,
      text: text
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder email sent for meeting "${meeting.title}" (${timeType})`);
  } catch (error) {
    console.error(`❌ Failed to send reminder email for meeting "${meeting.title}":`, error.message);
  }
};
