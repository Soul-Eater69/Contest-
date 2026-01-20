# Contest App Backend

Backend API for the Contest App with leaderboard functionality.

## Features

- User authentication (Register/Login)
- Create and manage MCQ contests
- Join and participate in contests
- Real-time leaderboard rankings
- Track participant progress

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/contest-app
JWT_SECRET=your_secure_secret_key
NODE_ENV=development
```

4. Make sure MongoDB is running

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Contests
- `POST /api/contests` - Create contest (protected)
- `GET /api/contests` - Get all public contests
- `GET /api/contests/my-contests` - Get my created contests (protected)
- `GET /api/contests/:id` - Get contest by ID
- `POST /api/contests/:id/join` - Join contest (protected)
- `POST /api/contests/:id/start` - Start contest (protected)
- `POST /api/contests/:id/submit` - Submit answers (protected)
- `GET /api/contests/:id/leaderboard` - Get contest leaderboard
- `GET /api/contests/:id/participation` - Get my participation status (protected)

### WebSocket Events

The server supports real-time updates via WebSockets:

**Client to Server:**
- `joinContestLeaderboard` - Join a contest's leaderboard room
- `leaveContestLeaderboard` - Leave a contest's leaderboard room
- `contestSubmitted` - Notify server of contest submission
- `userJoinedContest` - Notify when user joins contest
- `userStartedContest` - Notify when user starts contest

**Server to Client:**
- `leaderboardUpdate` - Real-time leaderboard updates
- `participantCountUpdate` - Live viewer count updates
- `contestParticipantUpdate` - Contest participant count changes
- `userActivity` - User activity notifications
- `error` - Error messages

## Models

### User
- username, email, password

### Contest
- title, description, questions, startTime, endTime, duration, status, createdBy

### Participant
- contest, user, joinedAt, hasStarted, hasCompleted

### Result
- contest, user, answers, totalScore, correctAnswers, wrongAnswers, timeTaken, rank
