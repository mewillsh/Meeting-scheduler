const router = require('express').Router();
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const meetingScheduler = require('../services/meetingScheduler');

// Create a new meeting
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, startTime, endTime, participants } = req.body;

    // Validate meeting times
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start <= now) {
      return res.status(400).json({ error: 'Meeting start time must be in the future' });
    }

    if (end <= start) {
      return res.status(400).json({ error: 'Meeting end time must be after start time' });
    }

    const meeting = await Meeting.create({
      title,
      description,
      startTime,
      endTime,
      participants,
      createdBy: req.user.id
    });

    // Send initial email invites
    await sendEmail(participants, meeting);

    // Schedule automatic reminders
    meetingScheduler.scheduleReminderForMeeting(meeting);

    console.log(`✅ Meeting "${title}" created with automatic reminders scheduled`);

    res.status(201).json({
      ...meeting.toObject(),
      message: 'Meeting created successfully with automatic reminders scheduled'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create meeting' });
  }
});

// Get all meetings created by the user
router.get('/', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find({ createdBy: req.user.id }).sort({ startTime: 1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Update meeting status (optional endpoint for manual status updates)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { status },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    console.log(`📝 Meeting "${meeting.title}" status updated to: ${status}`);

    res.json({
      ...meeting.toObject(),
      message: `Meeting status updated to ${status}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update meeting status' });
  }
});

// Delete a meeting
router.delete('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found or unauthorized' });
    }

    console.log(`🗑️ Meeting "${meeting.title}" deleted by user`);

    res.json({ 
      message: 'Meeting deleted successfully',
      deletedMeeting: {
        id: meeting._id,
        title: meeting.title,
        startTime: meeting.startTime
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

router.get('/analytics/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const stats = await Meeting.aggregate([
      // Match meetings created by the user and exclude cancelled and future meetings
      { 
        $match: { 
          createdBy: req.user.id,
          status: { $nin: ['cancelled'] }, // Exclude cancelled meetings
          $or: [
            { status: 'completed' }, // Include completed meetings
            { status: 'in-progress' }, // Include in-progress meetings
            { 
              status: 'scheduled',
              endTime: { $lte: now } // Include scheduled meetings that have already ended
            }
          ]
        } 
      },
      
      // Group by status and count
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalParticipants: { $sum: { $size: '$participants' } }
        }
      },
      
      // Sort by count descending
      { $sort: { count: -1 } }
    ]);

    // Get total executed meetings count (excluding cancelled and future meetings)
    const totalExecutedMeetings = await Meeting.countDocuments({ 
      createdBy: req.user.id,
      status: { $nin: ['cancelled'] },
      $or: [
        { status: 'completed' },
        { status: 'in-progress' },
        { 
          status: 'scheduled',
          endTime: { $lte: now }
        }
      ]
    });

    res.json({
      totalExecutedMeetings,
      statusBreakdown: stats,
      message: 'Meeting statistics for executed meetings only (excludes cancelled and future meetings)'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch meeting statistics' });
  }
});

// Get meetings by month using aggregation
router.get('/analytics/monthly', auth, async (req, res) => {
  try {
    const now = new Date();
    const monthlyData = await Meeting.aggregate([
      // Match meetings created by the user and exclude non-executed meetings
      { 
        $match: { 
          createdBy: req.user.id,
          status: { $nin: ['cancelled'] }, // Exclude cancelled meetings
          $or: [
            { status: 'completed' }, // Include completed meetings
            { status: 'in-progress' }, // Include in-progress meetings
            { 
              status: 'scheduled',
              endTime: { $lte: now } // Include scheduled meetings that have already ended
            }
          ]
        } 
      },
      
      // Group by year and month
      {
        $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' }
          },
          count: { $sum: 1 },
          meetings: {
            $push: {
              title: '$title',
              startTime: '$startTime',
              status: '$status'
            }
          }
        }
      },
      
      // Add month name for better readability
      {
        $addFields: {
          monthName: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id.month', 1] }, then: 'January' },
                { case: { $eq: ['$_id.month', 2] }, then: 'February' },
                { case: { $eq: ['$_id.month', 3] }, then: 'March' },
                { case: { $eq: ['$_id.month', 4] }, then: 'April' },
                { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                { case: { $eq: ['$_id.month', 6] }, then: 'June' },
                { case: { $eq: ['$_id.month', 7] }, then: 'July' },
                { case: { $eq: ['$_id.month', 8] }, then: 'August' },
                { case: { $eq: ['$_id.month', 9] }, then: 'September' },
                { case: { $eq: ['$_id.month', 10] }, then: 'October' },
                { case: { $eq: ['$_id.month', 11] }, then: 'November' },
                { case: { $eq: ['$_id.month', 12] }, then: 'December' }
              ],
              default: 'Unknown'
            }
          }
        }
      },
      
      // Sort by year and month
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    res.json({
      monthlyBreakdown: monthlyData,
      message: 'Monthly meeting data for executed meetings only (excludes cancelled and future meetings)'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch monthly meeting data' });
  }
});

// Get participant analytics using aggregation
router.get('/analytics/participants', auth, async (req, res) => {
  try {
    const now = new Date();
    const participantStats = await Meeting.aggregate([
      // Match meetings created by the user and exclude non-executed meetings
      { 
        $match: { 
          createdBy: req.user.id,
          status: { $nin: ['cancelled'] }, // Exclude cancelled meetings
          $or: [
            { status: 'completed' }, // Include completed meetings
            { status: 'in-progress' }, // Include in-progress meetings
            { 
              status: 'scheduled',
              endTime: { $lte: now } // Include scheduled meetings that have already ended
            }
          ]
        } 
      },
      
      // Unwind the participants array to create separate documents for each participant
      { $unwind: '$participants' },
      
      // Group by participant email
      {
        $group: {
          _id: '$participants',
          meetingCount: { $sum: 1 },
          meetings: {
            $push: {
              title: '$title',
              startTime: '$startTime',
              status: '$status'
            }
          }
        }
      },
      
      // Sort by meeting count descending
      { $sort: { meetingCount: -1 } },
      
      // Limit to top 10 most frequent participants
      { $limit: 10 },
      
      // Rename _id to email for clarity
      {
        $project: {
          _id: 0,
          email: '$_id',
          meetingCount: 1,
          meetings: 1
        }
      }
    ]);

    res.json({
      topParticipants: participantStats,
      message: 'Participant analytics for executed meetings only (excludes cancelled and future meetings)'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch participant analytics' });
  }
});

// Get upcoming meetings with time analysis using aggregation
router.get('/analytics/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const upcomingAnalysis = await Meeting.aggregate([
      // Match upcoming meetings for the user
      {
        $match: {
          createdBy: req.user.id,
          startTime: { $gte: now },
          status: 'scheduled'
        }
      },
      
      // Add calculated fields
      {
        $addFields: {
          // Calculate duration in minutes
          durationMinutes: {
            $divide: [
              { $subtract: ['$endTime', '$startTime'] },
              1000 * 60
            ]
          },
          // Calculate time until meeting in hours
          hoursUntilMeeting: {
            $divide: [
              { $subtract: ['$startTime', now] },
              1000 * 60 * 60
            ]
          },
          // Count participants
          participantCount: { $size: '$participants' }
        }
      },
      
      // Group by different time categories
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$hoursUntilMeeting', 1] }, then: 'Within 1 hour' },
                { case: { $lte: ['$hoursUntilMeeting', 24] }, then: 'Within 24 hours' },
                { case: { $lte: ['$hoursUntilMeeting', 168] }, then: 'Within 1 week' },
              ],
              default: 'More than 1 week'
            }
          },
          count: { $sum: 1 },
          averageDuration: { $avg: '$durationMinutes' },
          totalParticipants: { $sum: '$participantCount' },
          meetings: {
            $push: {
              title: '$title',
              startTime: '$startTime',
              durationMinutes: '$durationMinutes',
              participantCount: '$participantCount'
            }
          }
        }
      },
      
      // Sort by urgency
      {
        $sort: {
          '_id': 1
        }
      }
    ]);

    res.json({
      upcomingMeetingsAnalysis: upcomingAnalysis,
      message: 'Upcoming meetings analysis generated using MongoDB aggregation'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch upcoming meetings analysis' });
  }
});

// Get comprehensive dashboard analytics using multiple aggregations
router.get('/analytics/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Define the match criteria for executed meetings only
    const executedMeetingsMatch = {
      createdBy: userId,
      status: { $nin: ['cancelled'] },
      $or: [
        { status: 'completed' },
        { status: 'in-progress' },
        { 
          status: 'scheduled',
          endTime: { $lte: now }
        }
      ]
    };
    
    // Run multiple aggregations in parallel
    const [
      statusStats,
      recentActivity,
      avgMeetingDuration,
      participantInsights
    ] = await Promise.all([
      // Status distribution for executed meetings only
      Meeting.aggregate([
        { $match: executedMeetingsMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      // Recent activity (last 30 days) for executed meetings only
      Meeting.aggregate([
        {
          $match: {
            ...executedMeetingsMatch,
            createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            meetingsCreated: { $sum: 1 }
          }
        },
        { $sort: { '_id': -1 } },
        { $limit: 7 } // Last 7 days
      ]),
      
      // Average meeting duration by status for executed meetings only
      Meeting.aggregate([
        { $match: executedMeetingsMatch },
        {
          $addFields: {
            durationMinutes: {
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                1000 * 60
              ]
            }
          }
        },
        {
          $group: {
            _id: '$status',
            avgDuration: { $avg: '$durationMinutes' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Participant insights for executed meetings only
      Meeting.aggregate([
        { $match: executedMeetingsMatch },
        {
          $group: {
            _id: null,
            totalMeetings: { $sum: 1 },
            avgParticipants: { $avg: { $size: '$participants' } },
            maxParticipants: { $max: { $size: '$participants' } },
            minParticipants: { $min: { $size: '$participants' } }
          }
        }
      ])
    ]);

    res.json({
      dashboard: {
        statusDistribution: statusStats,
        recentActivity: recentActivity,
        averageDurations: avgMeetingDuration,
        participantMetrics: participantInsights[0] || {},
        generatedAt: new Date(),
        dataSource: 'MongoDB Aggregation Pipeline (Executed Meetings Only)'
      },
      message: 'Comprehensive dashboard analytics for executed meetings only (excludes cancelled and future meetings)'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

module.exports = router;
