const nodemailer = require('nodemailer');
const googleMeet = require('./googleMeet');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = async function sendEmail(recipients, meeting) {
  // Generate invitation content
  const textContent = googleMeet.generateInvitationText(meeting);
  const htmlContent = googleMeet.generateHtmlInvitation(meeting);
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipients.join(','),
    subject: `📅 Meeting Invitation: ${meeting.title}`,
    text: textContent,
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Meeting invitation sent to: ${recipients.join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to send meeting invitation:', error.message);
    throw error;
  }
};
