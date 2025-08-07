import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Analytics.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchAnalytics();
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/meetings/analytics/${activeTab}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => {
    if (!analytics?.dashboard) return null;

    const { statusDistribution, recentActivity, averageDurations, participantMetrics } = analytics.dashboard;

    return (
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>📊 Meeting Status Distribution</h3>
          <div className="status-stats">
            {statusDistribution.map(stat => (
              <div key={stat._id} className="stat-item">
                <span className="stat-label">{stat._id || 'scheduled'}:</span>
                <span className="stat-value">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h3>📈 Recent Activity (Last 7 Days)</h3>
          <div className="activity-stats">
            {recentActivity.map(activity => (
              <div key={activity._id} className="activity-item">
                <span className="activity-date">{activity._id}</span>
                <span className="activity-count">{activity.meetingsCreated} meetings</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h3>⏰ Average Duration by Status</h3>
          <div className="duration-stats">
            {averageDurations.map(duration => (
              <div key={duration._id} className="duration-item">
                <span className="duration-status">{duration._id}:</span>
                <span className="duration-time">{Math.round(duration.avgDuration)} min</span>
                <span className="duration-count">({duration.count} meetings)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h3>👥 Participant Metrics</h3>
          <div className="participant-stats">
            <div className="metric">
              <span className="metric-label">Total Meetings:</span>
              <span className="metric-value">{participantMetrics.totalMeetings || 0}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Avg Participants:</span>
              <span className="metric-value">{Math.round(participantMetrics.avgParticipants || 0)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Max Participants:</span>
              <span className="metric-value">{participantMetrics.maxParticipants || 0}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStats = () => {
    if (!analytics?.statusBreakdown) return null;

    return (
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>📊 Meeting Statistics</h3>
          <p className="total-meetings">Total Meetings: {analytics.totalMeetings}</p>
          <div className="status-breakdown">
            {analytics.statusBreakdown.map(status => (
              <div key={status._id} className="status-item">
                <div className="status-info">
                  <span className="status-name">{status._id || 'scheduled'}</span>
                  <span className="status-count">{status.count} meetings</span>
                </div>
                <div className="status-participants">
                  {status.totalParticipants} total participants
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthly = () => {
    if (!analytics?.monthlyBreakdown) return null;

    return (
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>📅 Monthly Breakdown</h3>
          <div className="monthly-stats">
            {analytics.monthlyBreakdown.map(month => (
              <div key={`${month._id.year}-${month._id.month}`} className="month-item">
                <div className="month-header">
                  <span className="month-name">{month.monthName} {month._id.year}</span>
                  <span className="month-count">{month.count} meetings</span>
                </div>
                <div className="month-meetings">
                  {month.meetings.slice(0, 3).map((meeting, index) => (
                    <div key={index} className="mini-meeting">
                      {meeting.title} - {meeting.status}
                    </div>
                  ))}
                  {month.meetings.length > 3 && (
                    <div className="more-meetings">
                      +{month.meetings.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderParticipants = () => {
    if (!analytics?.topParticipants) return null;

    return (
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>👥 Top Participants</h3>
          <div className="participants-list">
            {analytics.topParticipants.map((participant, index) => (
              <div key={participant.email} className="participant-item">
                <div className="participant-rank">#{index + 1}</div>
                <div className="participant-info">
                  <div className="participant-email">{participant.email}</div>
                  <div className="participant-meetings">{participant.meetingCount} meetings</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="header-nav">
          <Link to="/dashboard" className="back-link">
            ← Back to Dashboard
          </Link>
        </div>
        <h2>📊 Meeting Analytics</h2>
        <p className="aggregation-note">
          ⚡ Powered by MongoDB Aggregation Pipelines
        </p>
      </div>

      <div className="analytics-tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button
          className={`tab ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly
        </button>
        <button
          className={`tab ${activeTab === 'participants' ? 'active' : ''}`}
          onClick={() => setActiveTab('participants')}
        >
          Participants
        </button>
      </div>

      <div className="analytics-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'monthly' && renderMonthly()}
        {activeTab === 'participants' && renderParticipants()}
      </div>

      {analytics?.message && (
        <div className="analytics-footer">
          <small>ℹ️ {analytics.message}</small>
        </div>
      )}
    </div>
  );
};

export default Analytics;
