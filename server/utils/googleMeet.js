const crypto = require('crypto');

class GoogleMeetService {
  
  /**
   * Generate a unique meeting ID for Google Meet
   * Format: xxx-yyyy-zzz (similar to Google Meet format)
   */
  generateMeetingId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    
    // Generate 3 random letters
    let part1 = '';
    for (let i = 0; i < 3; i++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Generate 4 random characters (letters + numbers)
    let part2 = '';
    const alphanumeric = chars + numbers;
    for (let i = 0; i < 4; i++) {
      part2 += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
    }
    
    // Generate 3 random characters
    let part3 = '';
    for (let i = 0; i < 3; i++) {
      part3 += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length));
    }
    
    return `${part1}-${part2}-${part3}`;
  }

  /**
   * Generate Google Meet link using meeting ID
   * @param {string} meetingId - Unique meeting identifier
   * @returns {string} - Complete Google Meet URL
   */
  generateMeetLink(meetingId) {
    return `https://meet.google.com/${meetingId}`;
  }

  /**
   * Create a complete Google Meet setup for a meeting
   * @param {Object} meetingData - Meeting information
   * @returns {Object} - Meeting ID and Google Meet link
   */
  createMeetingSetup(meetingData) {
    const meetingId = this.generateMeetingId();
    const googleMeetLink = this.generateMeetLink(meetingId);
    
    return {
      meetingId,
      googleMeetLink,
      meetingData: {
        ...meetingData,
        meetingId,
        googleMeetLink
      }
    };
  }

  /**
   * Generate calendar event URL for Google Calendar
   * This creates a link that users can click to add the meeting to their calendar
   * @param {Object} meeting - Meeting object with details
   * @returns {string} - Google Calendar add event URL
   */
  generateCalendarEventUrl(meeting) {
    const startTime = new Date(meeting.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(meeting.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: meeting.title,
      dates: `${startTime}/${endTime}`,
      details: `${meeting.description || ''}\n\nJoin Google Meet: ${meeting.googleMeetLink}`,
      location: meeting.googleMeetLink
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generate meeting invitation text for emails
   * @param {Object} meeting - Meeting object
   * @returns {string} - Formatted invitation text
   */
  generateInvitationText(meeting) {
    const startTime = new Date(meeting.startTime).toLocaleString();
    const endTime = new Date(meeting.endTime).toLocaleString();
    
    return `
📅 Meeting Invitation: ${meeting.title}

📍 When: ${startTime} - ${endTime}
📝 Description: ${meeting.description || 'No description provided'}

🎥 Join Google Meet:
${meeting.googleMeetLink}

📞 Alternative dial-in options:
You can also join by phone if needed.

📅 Add to Calendar:
${this.generateCalendarEventUrl(meeting)}

---
This meeting was scheduled through Meeting Scheduler App
    `.trim();
  }

  /**
   * Generate HTML email template for meeting invitations
   * @param {Object} meeting - Meeting object
   * @returns {string} - HTML email template
   */
  generateHtmlInvitation(meeting) {
    const startTime = new Date(meeting.startTime).toLocaleString();
    const endTime = new Date(meeting.endTime).toLocaleString();
    const calendarUrl = this.generateCalendarEventUrl(meeting);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4285f4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .meet-button { 
      display: inline-block; 
      background: #34a853; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin: 10px 0;
    }
    .calendar-button {
      display: inline-block; 
      background: #4285f4; 
      color: white; 
      padding: 12px 24px; 
      text-decoration: none; 
      border-radius: 4px; 
      margin: 10px 0;
    }
    .details { background: white; padding: 15px; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📅 Meeting Invitation</h2>
      <h3>${meeting.title}</h3>
    </div>
    <div class="content">
      <div class="details">
        <p><strong>📍 When:</strong> ${startTime} - ${endTime}</p>
        <p><strong>📝 Description:</strong> ${meeting.description || 'No description provided'}</p>
      </div>
      
      <p><strong>Join the meeting:</strong></p>
      <a href="${meeting.googleMeetLink}" class="meet-button">🎥 Join Google Meet</a>
      
      <p><strong>Add to your calendar:</strong></p>
      <a href="${calendarUrl}" class="calendar-button">📅 Add to Google Calendar</a>
      
      <div class="details">
        <p><strong>Meeting Link:</strong> <a href="${meeting.googleMeetLink}">${meeting.googleMeetLink}</a></p>
        <p><em>You can join by clicking the link above or manually entering the meeting ID in Google Meet.</em></p>
      </div>
      
      <hr>
      <p><small>This meeting was scheduled through Meeting Scheduler App</small></p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

module.exports = new GoogleMeetService();
