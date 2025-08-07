const cron = require('node-cron');
const Meeting = require('../models/Meeting');
const sendReminderEmail = require('../utils/sendReminderEmail');

class MeetingScheduler {
  constructor() {
    this.reminderJobs = new Map(); // To track individual meeting reminder jobs
  }

  // Start the main scheduler that runs every minute
  startScheduler() {
    console.log('🕐 Meeting reminder scheduler started');
    
    // Run every minute to check for upcoming meetings
    cron.schedule('* * * * *', async () => {
      await this.checkUpcomingMeetings();
    });

    // Also run a cleanup job daily at midnight to remove old completed meetings
    cron.schedule('0 0 * * *', async () => {
      await this.cleanupOldMeetings();
    });
  }

  async checkUpcomingMeetings() {
    try {
      const now = new Date();
      const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
      const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour
      const fifteenMinsFromNow = new Date(now.getTime() + (15 * 60 * 1000)); // 15 minutes

      // Find meetings that need reminders
      const meetings = await Meeting.find({
        startTime: { $gte: now }, // Future meetings only
        status: 'scheduled'
      });

      for (const meeting of meetings) {
        const meetingStart = new Date(meeting.startTime);

        // Check for 24-hour reminder
        if (!meeting.remindersSent.oneDayBefore && 
            meetingStart <= oneDayFromNow && meetingStart > oneHourFromNow) {
          await this.sendReminder(meeting, 'oneDayBefore');
        }

        // Check for 1-hour reminder
        if (!meeting.remindersSent.oneHourBefore && 
            meetingStart <= oneHourFromNow && meetingStart > fifteenMinsFromNow) {
          await this.sendReminder(meeting, 'oneHourBefore');
        }

        // Check for 15-minute reminder
        if (!meeting.remindersSent.fifteenMinsBefore && 
            meetingStart <= fifteenMinsFromNow && meetingStart > now) {
          await this.sendReminder(meeting, 'fifteenMinsBefore');
        }

        // Mark meeting as in-progress if it has started
        if (meetingStart <= now && meeting.status === 'scheduled') {
          await Meeting.findByIdAndUpdate(meeting._id, { status: 'in-progress' });
        }

        // Mark meeting as completed if it has ended
        const meetingEnd = new Date(meeting.endTime);
        if (meetingEnd <= now && meeting.status === 'in-progress') {
          await Meeting.findByIdAndUpdate(meeting._id, { status: 'completed' });
        }
      }
    } catch (error) {
      console.error('❌ Error checking upcoming meetings:', error.message);
    }
  }

  async sendReminder(meeting, reminderType) {
    try {
      // Send reminder email to all participants
      await sendReminderEmail(meeting.participants, meeting, reminderType);

      // Update the meeting to mark this reminder as sent
      const updateField = `remindersSent.${reminderType}`;
      await Meeting.findByIdAndUpdate(meeting._id, {
        $set: { [updateField]: true }
      });

      console.log(`📧 ${reminderType} reminder sent for meeting: ${meeting.title}`);
    } catch (error) {
      console.error(`❌ Failed to send ${reminderType} reminder for meeting ${meeting.title}:`, error.message);
    }
  }

  // Schedule a specific reminder for a newly created meeting
  scheduleReminderForMeeting(meeting) {
    const meetingStart = new Date(meeting.startTime);
    const now = new Date();

    // Calculate when to send reminders
    const oneDayBefore = new Date(meetingStart.getTime() - (24 * 60 * 60 * 1000));
    const oneHourBefore = new Date(meetingStart.getTime() - (60 * 60 * 1000));
    const fifteenMinsBefore = new Date(meetingStart.getTime() - (15 * 60 * 1000));

    // Schedule 24-hour reminder
    if (oneDayBefore > now) {
      const job24h = cron.schedule(this.dateToCronExpression(oneDayBefore), async () => {
        await this.sendReminder(meeting, 'oneDayBefore');
        job24h.destroy();
      }, { scheduled: false });
      job24h.start();
    }

    // Schedule 1-hour reminder
    if (oneHourBefore > now) {
      const job1h = cron.schedule(this.dateToCronExpression(oneHourBefore), async () => {
        await this.sendReminder(meeting, 'oneHourBefore');
        job1h.destroy();
      }, { scheduled: false });
      job1h.start();
    }

    // Schedule 15-minute reminder
    if (fifteenMinsBefore > now) {
      const job15m = cron.schedule(this.dateToCronExpression(fifteenMinsBefore), async () => {
        await this.sendReminder(meeting, 'fifteenMinsBefore');
        job15m.destroy();
      }, { scheduled: false });
      job15m.start();
    }
  }

  // Convert Date to cron expression
  dateToCronExpression(date) {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${minutes} ${hours} ${day} ${month} *`;
  }

  // Clean up old completed meetings (optional)
  async cleanupOldMeetings() {
    try {
      const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
      
      const result = await Meeting.deleteMany({
        status: 'completed',
        endTime: { $lt: oneWeekAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} old completed meetings`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up old meetings:', error.message);
    }
  }
}

module.exports = new MeetingScheduler();
