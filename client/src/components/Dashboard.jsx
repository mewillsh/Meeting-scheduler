import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    participants: ''
  });

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await axios.get('/api/meetings');
      setMeetings(response.data);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      const participantsList = formData.participants
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      await axios.post('/api/meetings', {
        ...formData,
        participants: participantsList
      });

      setFormData({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        participants: ''
      });
      setShowCreateForm(false);
      fetchMeetings();
    } catch (error) {
      console.error('Failed to create meeting:', error);
      alert('Failed to create meeting. Please try again.');
    }
  };

  const handleDeleteMeeting = async (meetingId, meetingTitle) => {
    if (window.confirm(`Are you sure you want to delete the meeting "${meetingTitle}"?`)) {
      try {
        await axios.delete(`/api/meetings/${meetingId}`);
        fetchMeetings(); // Refresh the meetings list
        alert('Meeting deleted successfully!');
      } catch (error) {
        console.error('Failed to delete meeting:', error);
        alert('Failed to delete meeting. Please try again.');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return '#007bff';
      case 'in-progress': return '#28a745';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#007bff';
    }
  };

  const getTimeUntilMeeting = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start - now;
    
    if (diffMs <= 0) return 'Started';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours >= 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `in ${diffHours}h ${diffMins}m`;
    } else {
      return `in ${diffMins} minutes`;
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Meeting Scheduler</h1>
          <div className="user-info">
            <Link to="/analytics" className="analytics-link">
              📊 Analytics
            </Link>
            <span>Welcome, {user?.name}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="actions">
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="create-btn"
            >
              {showCreateForm ? 'Cancel' : 'Create New Meeting'}
            </button>
            
            <div className="feature-info">
              <span className="info-icon">💡</span>
              <span>Automatic email reminders will be sent 24h, 1h, and 15min before each meeting!</span>
            </div>
          </div>

          {showCreateForm && (
            <div className="create-form-container">
              <h3>Create New Meeting</h3>
              <form onSubmit={handleCreateMeeting} className="create-form">
                <div className="form-group">
                  <label>Title:</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time:</label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time:</label>
                    <input
                      type="datetime-local"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Participants (comma-separated emails):</label>
                  <input
                    type="text"
                    name="participants"
                    value={formData.participants}
                    onChange={handleChange}
                    placeholder="email1@example.com, email2@example.com"
                    required
                  />
                </div>

                <button type="submit" className="submit-btn">Create Meeting</button>
              </form>
            </div>
          )}

          <div className="meetings-section">
            <h3>Your Meetings</h3>
            {meetings.length === 0 ? (
              <p className="no-meetings">No meetings created yet.</p>
            ) : (
              <div className="meetings-list">
                {meetings.map(meeting => (
                  <div key={meeting._id} className="meeting-card">
                    <div className="meeting-header">
                      <h4>{meeting.title}</h4>
                      <div className="meeting-actions">
                        <div className="meeting-badges">
                          <span 
                            className="status-badge" 
                            style={{ backgroundColor: getStatusColor(meeting.status || 'scheduled') }}
                          >
                            {(meeting.status || 'scheduled').replace('-', ' ')}
                          </span>
                          {meeting.status !== 'completed' && meeting.status !== 'cancelled' && (
                            <span className="time-badge">
                              {getTimeUntilMeeting(meeting.startTime)}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => handleDeleteMeeting(meeting._id, meeting.title)}
                          className="delete-btn"
                          title="Delete Meeting"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {meeting.description && <p className="description">{meeting.description}</p>}
                    <div className="meeting-details">
                      <p><strong>Start:</strong> {formatDateTime(meeting.startTime)}</p>
                      <p><strong>End:</strong> {formatDateTime(meeting.endTime)}</p>
                      <p><strong>Participants:</strong> {meeting.participants.join(', ')}</p>
                      <p className="reminder-info">
                        <strong>📧 Automatic reminders:</strong> 24h, 1h, and 15min before start
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
