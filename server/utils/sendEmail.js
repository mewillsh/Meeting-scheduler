const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = async function sendEmail(recipients, meeting) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipients.join(','),
    subject: `Meeting Invitation: ${meeting.title}`,
    text: `You have been invited to a meeting:

Title: ${meeting.title}
Description: ${meeting.description}
Starts At: ${new Date(meeting.startTime).toLocaleString()}
Ends At: ${new Date(meeting.endTime).toLocaleString()}

Don't be late!`
  };

  await transporter.sendMail(mailOptions);
};
