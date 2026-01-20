// Custom WebSocket room manager (not using socket.io rooms)
class WebSocketManager {
  constructor() {
    // Store contest participants: { contestId: Set of socket IDs }
    this.contestParticipants = new Map();
    // Store socket to contest mapping: { socketId: contestId }
    this.socketToContest = new Map();
    // Store socket references: { socketId: socket }
    this.sockets = new Map();
  }

  // Add socket to the manager
  addSocket(socket) {
    this.sockets.set(socket.id, socket);
  }

  // Remove socket from the manager
  removeSocket(socketId) {
    // Get the contest this socket was in
    const contestId = this.socketToContest.get(socketId);

    if (contestId) {
      // Remove from contest participants
      const participants = this.contestParticipants.get(contestId);
      if (participants) {
        participants.delete(socketId);

        // If no more participants, remove the contest entry
        if (participants.size === 0) {
          this.contestParticipants.delete(contestId);
        } else {
          // Notify remaining participants about the count change
          this.broadcastToContest(contestId, 'participantCountUpdate', {
            count: participants.size
          });
        }
      }

      this.socketToContest.delete(socketId);
    }

    this.sockets.delete(socketId);
  }

  // Join a contest (custom room logic)
  joinContest(socketId, contestId) {
    // Remove from previous contest if any
    const previousContest = this.socketToContest.get(socketId);
    if (previousContest) {
      this.leaveContest(socketId, previousContest);
    }

    // Add to new contest
    if (!this.contestParticipants.has(contestId)) {
      this.contestParticipants.set(contestId, new Set());
    }

    this.contestParticipants.get(contestId).add(socketId);
    this.socketToContest.set(socketId, contestId);

    // Broadcast participant count update
    this.broadcastToContest(contestId, 'participantCountUpdate', {
      count: this.contestParticipants.get(contestId).size
    });
  }

  // Leave a contest
  leaveContest(socketId, contestId) {
    const participants = this.contestParticipants.get(contestId);
    if (participants) {
      participants.delete(socketId);

      if (participants.size === 0) {
        this.contestParticipants.delete(contestId);
      } else {
        this.broadcastToContest(contestId, 'participantCountUpdate', {
          count: participants.size
        });
      }
    }

    if (this.socketToContest.get(socketId) === contestId) {
      this.socketToContest.delete(socketId);
    }
  }

  // Broadcast message to all participants in a contest
  broadcastToContest(contestId, event, data) {
    const participants = this.contestParticipants.get(contestId);
    if (!participants) return;

    participants.forEach(socketId => {
      const socket = this.sockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
      }
    });
  }

  // Send message to specific socket
  sendToSocket(socketId, event, data) {
    const socket = this.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  // Get participant count for a contest
  getParticipantCount(contestId) {
    const participants = this.contestParticipants.get(contestId);
    return participants ? participants.size : 0;
  }

  // Get all active contests
  getActiveContests() {
    return Array.from(this.contestParticipants.keys());
  }
}

module.exports = new WebSocketManager();
