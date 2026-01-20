import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { contestAPI } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { getSocket } from '../../../lib/socket';

export default function TakeContest() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuth();

  const [contest, setContest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && isAuthenticated) {
      startContest();
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && startTime) {
      handleSubmit();
    }
  }, [timeLeft]);

  const startContest = async () => {
    try {
      setLoading(true);
      const response = await contestAPI.startContest(id);
      setContest(response.data.contest);
      setStartTime(new Date(response.data.startedAt));
      setTimeLeft(response.data.contest.duration * 60);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to start contest');
      console.error('Error starting contest:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex,
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const unanswered = contest.questions.filter(q => answers[q._id] === undefined);

    if (unanswered.length > 0 && timeLeft > 0) {
      const confirm = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    setError('');

    try {
      const timeTaken = contest.duration * 60 - timeLeft;
      const formattedAnswers = Object.keys(answers).map((questionId) => ({
        questionId,
        selectedAnswer: answers[questionId],
      }));

      await contestAPI.submitContest(id, {
        answers: formattedAnswers,
        timeTaken,
      });

      // Emit WebSocket event for real-time leaderboard update
      const socket = getSocket();
      if (socket) {
        socket.emit('contestSubmitted', { contestId: id });
      }

      router.push(`/contest/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit contest');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="alert alert-error">Please login to take this contest</div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading contest...</div>
      </Layout>
    );
  }

  if (error && !contest) {
    return (
      <Layout>
        <div className="alert alert-error">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="timer">
          Time Left: {formatTime(timeLeft)}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <h2 className="card-title" style={{ fontSize: '28px', marginBottom: '10px' }}>
            {contest.title}
          </h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Answer all questions and submit before time runs out
          </p>
        </div>

        {contest.questions.map((question, index) => (
          <div key={question._id} className="question-card">
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
              Question {index + 1} ({question.points} points)
            </h3>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>{question.question}</p>

            <div>
              {question.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className={`option ${answers[question._id] === optionIndex ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(question._id, optionIndex)}
                >
                  <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {option}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ position: 'sticky', bottom: '20px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>
                Answered: {Object.keys(answers).length} / {contest.questions.length}
              </strong>
            </div>
            <button
              onClick={handleSubmit}
              className="btn btn-success"
              disabled={submitting}
              style={{ fontSize: '16px', padding: '12px 30px' }}
            >
              {submitting ? 'Submitting...' : 'Submit Contest'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
