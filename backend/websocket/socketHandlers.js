const jwt = require('jsonwebtoken');
const wsManager = require('./WebSocketManager');
const Contest = require('../models/Contest');
const Result = require('../models/Result');
const Participant = require('../models/Participant');

// Authenticate socket connection
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

// Setup socket event handlers
const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Add socket to manager
    wsManager.addSocket(socket);

    // Join contest leaderboard
    socket.on('joinContestLeaderboard', async (data) => {
      const { contestId } = data;

      if (!contestId) {
        return socket.emit('error', { message: 'Contest ID is required' });
      }

      try {
        // Verify contest exists
        const contest = await Contest.findById(contestId);
        if (!contest) {
          return socket.emit('error', { message: 'Contest not found' });
        }

        // Join the contest using custom logic
        wsManager.joinContest(socket.id, contestId);

        console.log(`Socket ${socket.id} joined contest ${contestId}`);

        // Send current leaderboard
        const leaderboard = await Result.find({ contest: contestId })
          .populate('user', 'username email')
          .sort({ totalScore: -1, timeTaken: 1 })
          .select('-answers');

        socket.emit('leaderboardUpdate', {
          contestId,
          leaderboard
        });

        // Send participant count
        const participantCount = wsManager.getParticipantCount(contestId);
        socket.emit('participantCountUpdate', {
          count: participantCount
        });

      } catch (error) {
        console.error('Error joining contest:', error);
        socket.emit('error', { message: 'Failed to join contest' });
      }
    });

    // Leave contest leaderboard
    socket.on('leaveContestLeaderboard', (data) => {
      const { contestId } = data;

      if (contestId) {
        wsManager.leaveContest(socket.id, contestId);
        console.log(`Socket ${socket.id} left contest ${contestId}`);
      }
    });

    // Handle contest submission (trigger leaderboard update)
    socket.on('contestSubmitted', async (data) => {
      const { contestId } = data;

      if (!contestId) {
        return;
      }

      try {
        // Fetch updated leaderboard
        const leaderboard = await Result.find({ contest: contestId })
          .populate('user', 'username email')
          .sort({ totalScore: -1, timeTaken: 1 })
          .select('-answers');

        // Broadcast to all participants in this contest
        wsManager.broadcastToContest(contestId, 'leaderboardUpdate', {
          contestId,
          leaderboard
        });

        console.log(`Leaderboard updated for contest ${contestId}`);

      } catch (error) {
        console.error('Error updating leaderboard:', error);
      }
    });

    // Handle user joining contest
    socket.on('userJoinedContest', async (data) => {
      const { contestId } = data;

      if (!contestId) {
        return;
      }

      try {
        // Get participant count
        const participantCount = await Participant.countDocuments({ contest: contestId });

        // Broadcast participant count update
        wsManager.broadcastToContest(contestId, 'contestParticipantUpdate', {
          contestId,
          participantCount
        });

        console.log(`User joined contest ${contestId}, total participants: ${participantCount}`);

      } catch (error) {
        console.error('Error updating participant count:', error);
      }
    });

    // Handle user starting contest
    socket.on('userStartedContest', (data) => {
      const { contestId, username } = data;

      if (!contestId) {
        return;
      }

      // Broadcast that a user started the contest
      wsManager.broadcastToContest(contestId, 'userActivity', {
        contestId,
        activity: 'started',
        username
      });

      console.log(`${username} started contest ${contestId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      wsManager.removeSocket(socket.id);
    });
  });
};

module.exports = {
  authenticateSocket,
  setupSocketHandlers
};
