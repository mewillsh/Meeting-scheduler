# Meeting Scheduler API Reference

## Quick Start
- Backend: http://localhost:5000
- Frontend: http://localhost:5174

## Authentication

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Your Name", "email": "your@email.com", "password": "password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your@email.com", "password": "password123"}'
```

## Meeting Operations (Requires JWT Token)

### Create Meeting
```bash
curl -X POST http://localhost:5000/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Team Meeting",
    "description": "Weekly sync",
    "startTime": "2025-08-10T10:00:00Z",
    "endTime": "2025-08-10T11:00:00Z",
    "participants": ["email1@example.com", "email2@example.com"]
  }'
```

### Get All Meetings
```bash
curl -X GET http://localhost:5000/api/meetings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete Meeting
```bash
curl -X DELETE http://localhost:5000/api/meetings/MEETING_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Meeting Status
```bash
curl -X PATCH http://localhost:5000/api/meetings/MEETING_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"status": "completed"}'
```

## Analytics Endpoints

### Dashboard Analytics
```bash
curl -X GET http://localhost:5000/api/meetings/analytics/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Meeting Statistics
```bash
curl -X GET http://localhost:5000/api/meetings/analytics/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Monthly Breakdown
```bash
curl -X GET http://localhost:5000/api/meetings/analytics/monthly \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Participant Analytics
```bash
curl -X GET http://localhost:5000/api/meetings/analytics/participants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Browser Testing (F12 Console)

```javascript
// Quick test in browser console
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({email: 'your@email.com', password: 'password123'})
}).then(r => r.json()).then(data => {
  window.token = data.token;
  console.log('Token saved:', data.token.substring(0,20) + '...');
});

// Test analytics
fetch('http://localhost:5000/api/meetings/analytics/dashboard', {
  headers: { 'Authorization': `Bearer ${window.token}` }
}).then(r => r.json()).then(console.log);
```
