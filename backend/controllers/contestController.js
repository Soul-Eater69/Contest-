const Contest = require('../models/Contest');
const Participant = require('../models/Participant');
const Result = require('../models/Result');
const { validationResult } = require('express-validator');

// Create Contest
exports.createContest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, questions, startTime, endTime, duration, maxParticipants, isPublic } = req.body;

    const contest = new Contest({
      title,
      description,
      questions,
      startTime,
      endTime,
      duration,
      maxParticipants,
      isPublic,
      createdBy: req.userId
    });

    contest.updateStatus();
    await contest.save();

    res.status(201).json({
      message: 'Contest created successfully',
      contest
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Contests
exports.getAllContests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { isPublic: true };

    if (status) {
      query.status = status;
    }

    const contests = await Contest.find(query)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    // Update status for each contest
    for (let contest of contests) {
      contest.updateStatus();
      await contest.save();
    }

    res.json(contests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Contest by ID (without answers for active contests)
exports.getContestById = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id).populate('createdBy', 'username');

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    contest.updateStatus();
    await contest.save();

    // Remove correct answers from response if contest is active or upcoming
    let contestData = contest.toObject();
    if (contest.status === 'active' || contest.status === 'upcoming') {
      contestData.questions = contestData.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        points: q.points
      }));
    }

    res.json(contestData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get My Contests (created by me)
exports.getMyContests = async (req, res) => {
  try {
    const contests = await Contest.find({ createdBy: req.userId }).sort({ createdAt: -1 });

    for (let contest of contests) {
      contest.updateStatus();
      await contest.save();
    }

    res.json(contests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Join Contest
exports.joinContest = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    contest.updateStatus();
    await contest.save();

    if (contest.status === 'completed') {
      return res.status(400).json({ message: 'Contest has already ended' });
    }

    // Check if max participants reached
    if (contest.maxParticipants) {
      const participantCount = await Participant.countDocuments({ contest: contest._id });
      if (participantCount >= contest.maxParticipants) {
        return res.status(400).json({ message: 'Contest is full' });
      }
    }

    // Check if already joined
    const existingParticipant = await Participant.findOne({
      contest: contest._id,
      user: req.userId
    });

    if (existingParticipant) {
      return res.status(400).json({ message: 'You have already joined this contest' });
    }

    // Create participant
    const participant = new Participant({
      contest: contest._id,
      user: req.userId
    });

    await participant.save();

    res.status(201).json({
      message: 'Successfully joined the contest',
      participant
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Start Contest (for participant)
exports.startContest = async (req, res) => {
  try {
    const participant = await Participant.findOne({
      contest: req.params.id,
      user: req.userId
    });

    if (!participant) {
      return res.status(404).json({ message: 'You have not joined this contest' });
    }

    if (participant.hasStarted) {
      return res.status(400).json({ message: 'You have already started this contest' });
    }

    const contest = await Contest.findById(req.params.id);
    contest.updateStatus();
    await contest.save();

    if (contest.status !== 'active') {
      return res.status(400).json({ message: 'Contest is not active' });
    }

    participant.hasStarted = true;
    participant.startedAt = new Date();
    await participant.save();

    // Return contest questions without correct answers
    const contestData = contest.toObject();
    contestData.questions = contestData.questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      points: q.points
    }));

    res.json({
      message: 'Contest started',
      contest: contestData,
      startedAt: participant.startedAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit Contest Answers
exports.submitContest = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;

    const participant = await Participant.findOne({
      contest: req.params.id,
      user: req.userId
    });

    if (!participant) {
      return res.status(404).json({ message: 'You have not joined this contest' });
    }

    if (!participant.hasStarted) {
      return res.status(400).json({ message: 'You have not started this contest' });
    }

    if (participant.hasCompleted) {
      return res.status(400).json({ message: 'You have already submitted this contest' });
    }

    const contest = await Contest.findById(req.params.id);

    // Check if already submitted
    const existingResult = await Result.findOne({
      contest: contest._id,
      user: req.userId
    });

    if (existingResult) {
      return res.status(400).json({ message: 'You have already submitted this contest' });
    }

    // Calculate score
    let totalScore = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    const processedAnswers = [];

    answers.forEach(answer => {
      const question = contest.questions.id(answer.questionId);
      if (question) {
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        const points = isCorrect ? question.points : 0;

        if (isCorrect) correctAnswers++;
        else wrongAnswers++;

        totalScore += points;

        processedAnswers.push({
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
          points
        });
      }
    });

    // Create result
    const result = new Result({
      contest: contest._id,
      user: req.userId,
      answers: processedAnswers,
      totalScore,
      correctAnswers,
      wrongAnswers,
      timeTaken
    });

    await result.save();

    // Mark participant as completed
    participant.hasCompleted = true;
    await participant.save();

    // Calculate rank
    await updateRankings(contest._id);

    const updatedResult = await Result.findById(result._id).populate('user', 'username');

    res.json({
      message: 'Contest submitted successfully',
      result: updatedResult
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Contest Leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const leaderboard = await Result.find({ contest: contest._id })
      .populate('user', 'username email')
      .sort({ totalScore: -1, timeTaken: 1 })
      .select('-answers');

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get My Participation Status
exports.getMyParticipation = async (req, res) => {
  try {
    const participant = await Participant.findOne({
      contest: req.params.id,
      user: req.userId
    });

    if (!participant) {
      return res.json({ hasJoined: false });
    }

    const result = await Result.findOne({
      contest: req.params.id,
      user: req.userId
    }).populate('user', 'username');

    res.json({
      hasJoined: true,
      hasStarted: participant.hasStarted,
      hasCompleted: participant.hasCompleted,
      startedAt: participant.startedAt,
      result: result || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to update rankings
async function updateRankings(contestId) {
  const results = await Result.find({ contest: contestId })
    .sort({ totalScore: -1, timeTaken: 1 });

  for (let i = 0; i < results.length; i++) {
    results[i].rank = i + 1;
    await results[i].save();
  }
}
