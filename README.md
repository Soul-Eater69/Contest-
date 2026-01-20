# Contest App with Leaderboard

A full-stack web application for creating and participating in MCQ-based contests with real-time leaderboard rankings.

## Features

### User Features
- **User Authentication**: Register and login with JWT-based authentication
- **Create Contests**: Any user can create MCQ-based contests
- **Join Contests**: Browse and join available contests
- **Take Contests**: Participate in contests with a timed quiz interface
- **Real-time Leaderboard**: View rankings with auto-refresh functionality
- **Track Progress**: View your own contest history and results

### Contest Features
- **MCQ Questions**: Create contests with multiple-choice questions
- **Flexible Scheduling**: Set start and end times for contests
- **Duration Control**: Define contest duration in minutes
- **Participant Limits**: Optional maximum participant limits
- **Point System**: Assign different points to different questions
- **Status Management**: Automatic status updates (upcoming, active, completed)

### Leaderboard Features
- **Real-time Rankings**: Rankings based on score and time taken
- **Auto-refresh**: Optional auto-refresh every 5 seconds
- **Detailed Statistics**: View contest statistics and participant performance
- **Visual Indicators**: Special highlighting for top 3 positions

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **Next.js** - React framework
- **React** - UI library
- **Axios** - HTTP client
- **date-fns** - Date formatting

## Project Structure

```
Contest-/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── contestController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Contest.js
│   │   ├── Participant.js
│   │   └── Result.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── contests.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── components/
    │   └── Layout.js
    ├── context/
    │   └── AuthContext.js
    ├── lib/
    │   └── api.js
    ├── pages/
    │   ├── contest/
    │   │   ├── [id].js
    │   │   └── [id]/
    │   │       ├── take.js
    │   │       └── leaderboard.js
    │   ├── create-contest.js
    │   ├── index.js
    │   ├── login.js
    │   ├── my-contests.js
    │   ├── register.js
    │   └── _app.js
    ├── styles/
    │   └── globals.css
    ├── .env.example
    ├── next.config.js
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/contest-app
JWT_SECRET=your_secure_secret_key_change_this
NODE_ENV=development
```

5. Start the backend server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` if needed:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

5. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage Guide

### Creating a Contest

1. Register or login to your account
2. Navigate to "Create Contest"
3. Fill in contest details:
   - Title and description
   - Start and end times
   - Duration in minutes
   - Optional participant limit
4. Add questions with:
   - Question text
   - Four options
   - Correct answer selection
   - Points for the question
5. Submit to create the contest

### Participating in a Contest

1. Browse available contests on the home page
2. Click "View Contest" to see details
3. Click "Join Contest" to register
4. When the contest is active, click "Start Contest"
5. Answer all questions within the time limit
6. Submit your answers
7. View your results and rank on the leaderboard

### Real-time Leaderboard

The leaderboard implements custom polling logic (without socket.io rooms):
- Auto-refreshes every 5 seconds when enabled
- Rankings update based on:
  - Primary: Total score (higher is better)
  - Secondary: Time taken (lower is better)
- Visual indicators for top 3 positions
- Comprehensive statistics display

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Contests
- `POST /api/contests` - Create contest (protected)
- `GET /api/contests` - Get all public contests
- `GET /api/contests/my-contests` - Get my contests (protected)
- `GET /api/contests/:id` - Get contest by ID
- `POST /api/contests/:id/join` - Join contest (protected)
- `POST /api/contests/:id/start` - Start contest (protected)
- `POST /api/contests/:id/submit` - Submit answers (protected)
- `GET /api/contests/:id/leaderboard` - Get leaderboard
- `GET /api/contests/:id/participation` - Get participation status (protected)

## Real-time Updates Without Socket.io

The application implements real-time updates using a polling mechanism:

1. **Leaderboard Auto-refresh**: The leaderboard page polls the API every 5 seconds
2. **Contest Status Updates**: Contest status is updated on each API request
3. **Participation Tracking**: Server tracks participant state (joined, started, completed)
4. **Client-side Timer**: Quiz timer runs on the client with server-side validation

This approach provides:
- Simple implementation without WebSocket complexity
- Better scalability for read-heavy operations
- No need for persistent connections
- Works well with serverless deployments

## Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Protected API routes
- Input validation with express-validator
- Unique constraints on database models
- One submission per user per contest
- Time-based contest access control

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC
