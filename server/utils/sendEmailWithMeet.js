const nodemailer = require('nodemailer');
const googleMeet = require('./googleMeet');

// Check if email credentials are available
const emailCredentialsAvailable = process.env.EMAIL_USER && process.env.EMAIL_PASS;

let transporter = null;

if (emailCredentialsAvailable) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
} else {
  console.warn('⚠️ Email credentials not found. Email functionality will be disabled.');
}

module.exports = async function sendEmail(recipients, meeting) {
  // Skip email sending if credentials are not available
  if (!emailCredentialsAvailable || !transporter) {
    console.log('📧 Email sending skipped - credentials not configured');
    return;
  }

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
    // Don't throw error to prevent server crash
    console.log('📧 Email sending failed but continuing with meeting creation');
  }
};
