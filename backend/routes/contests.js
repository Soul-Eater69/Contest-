const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const contestController = require('../controllers/contestController');
const auth = require('../middleware/auth');

// Create contest
router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
    body('startTime').isISO8601().withMessage('Valid start time is required'),
    body('endTime').isISO8601().withMessage('Valid end time is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute')
  ],
  contestController.createContest
);

// Get all contests
router.get('/', contestController.getAllContests);

// Get my contests
router.get('/my-contests', auth, contestController.getMyContests);

// Get contest by ID
router.get('/:id', contestController.getContestById);

// Join contest
router.post('/:id/join', auth, contestController.joinContest);

// Start contest
router.post('/:id/start', auth, contestController.startContest);

// Submit contest
router.post(
  '/:id/submit',
  auth,
  [
    body('answers').isArray().withMessage('Answers must be an array'),
    body('timeTaken').isInt({ min: 0 }).withMessage('Time taken is required')
  ],
  contestController.submitContest
);

// Get leaderboard
router.get('/:id/leaderboard', contestController.getLeaderboard);

// Get my participation status
router.get('/:id/participation', auth, contestController.getMyParticipation);

module.exports = router;
