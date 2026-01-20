import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { contestAPI } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export default function ContestDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuth();

  const [contest, setContest] = useState(null);
  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchContest();
      if (isAuthenticated) {
        fetchParticipation();
      }
    }
  }, [id, isAuthenticated]);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const response = await contestAPI.getContestById(id);
      setContest(response.data);
    } catch (error) {
      setError('Failed to load contest');
      console.error('Error fetching contest:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipation = async () => {
    try {
      const response = await contestAPI.getMyParticipation(id);
      setParticipation(response.data);
    } catch (error) {
      console.error('Error fetching participation:', error);
    }
  };

  const handleJoin = async () => {
    setError('');
    setActionLoading(true);
    try {
      await contestAPI.joinContest(id);
      fetchParticipation();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join contest');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setError('');
    setActionLoading(true);
    try {
      await contestAPI.startContest(id);
      router.push(`/contest/${id}/take`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start contest');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'upcoming':
        return 'badge-upcoming';
      case 'active':
        return 'badge-active';
      case 'completed':
        return 'badge-completed';
      default:
        return '';
    }
  };

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
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
            <h2 className="card-title" style={{ fontSize: '28px' }}>
              {contest.title}
            </h2>
            <span className={`badge ${getStatusBadgeClass(contest.status)}`}>
              {contest.status}
            </span>
          </div>

          <p className="card-description" style={{ fontSize: '16px', marginBottom: '20px' }}>
            {contest.description}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '10px' }}>Contest Details</h4>
              <p>Created by: {contest.createdBy?.username}</p>
              <p>Questions: {contest.questions?.length}</p>
              <p>Duration: {contest.duration} minutes</p>
              <p>Total Points: {contest.questions?.reduce((sum, q) => sum + q.points, 0)}</p>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '10px' }}>Schedule</h4>
              <p>Start: {format(new Date(contest.startTime), 'PPp')}</p>
              <p>End: {format(new Date(contest.endTime), 'PPp')}</p>
              {contest.maxParticipants && (
                <p>Max Participants: {contest.maxParticipants}</p>
              )}
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="alert alert-info">
              Please login to participate in this contest
            </div>
          ) : participation?.hasCompleted ? (
            <div>
              <div className="alert alert-success">
                You have completed this contest!
              </div>
              {participation.result && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '10px' }}>Your Results</h4>
                  <p>Score: {participation.result.totalScore} points</p>
                  <p>Correct Answers: {participation.result.correctAnswers}</p>
                  <p>Wrong Answers: {participation.result.wrongAnswers}</p>
                  <p>Time Taken: {Math.floor(participation.result.timeTaken / 60)} minutes</p>
                  {participation.result.rank && <p>Rank: #{participation.result.rank}</p>}
                </div>
              )}
              <button
                onClick={() => router.push(`/contest/${id}/leaderboard`)}
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
              >
                View Leaderboard
              </button>
            </div>
          ) : participation?.hasStarted ? (
            <div>
              <div className="alert alert-info">
                You have started this contest. Continue where you left off.
              </div>
              <button
                onClick={() => router.push(`/contest/${id}/take`)}
                className="btn btn-success"
                style={{ marginTop: '20px' }}
              >
                Continue Contest
              </button>
            </div>
          ) : participation?.hasJoined ? (
            <div>
              <div className="alert alert-success">
                You have joined this contest!
              </div>
              {contest.status === 'active' ? (
                <button
                  onClick={handleStart}
                  className="btn btn-success"
                  style={{ marginTop: '20px' }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Starting...' : 'Start Contest'}
                </button>
              ) : (
                <div className="alert alert-info" style={{ marginTop: '20px' }}>
                  Contest is not active yet. Please wait for it to start.
                </div>
              )}
            </div>
          ) : (
            <div>
              {contest.status === 'completed' ? (
                <div className="alert alert-info">
                  This contest has ended
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Joining...' : 'Join Contest'}
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => router.push(`/contest/${id}/leaderboard`)}
            className="btn btn-outline"
            style={{ marginTop: '20px', marginLeft: '10px' }}
          >
            View Leaderboard
          </button>
        </div>

        {contest.status === 'completed' && contest.questions && (
          <div className="card" style={{ marginTop: '20px' }}>
            <h3 className="card-title">Questions & Answers</h3>
            {contest.questions.map((q, index) => (
              <div key={q._id} style={{ marginTop: '20px', paddingTop: '20px', borderTop: index > 0 ? '1px solid #ddd' : 'none' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '10px' }}>
                  Question {index + 1} ({q.points} points)
                </h4>
                <p style={{ marginBottom: '10px' }}>{q.question}</p>
                <div>
                  {q.options.map((option, oIndex) => (
                    <div
                      key={oIndex}
                      style={{
                        padding: '10px',
                        margin: '5px 0',
                        borderRadius: '5px',
                        background: oIndex === q.correctAnswer ? '#d4edda' : '#f8f9fa',
                        border: oIndex === q.correctAnswer ? '2px solid #28a745' : '1px solid #ddd',
                      }}
                    >
                      {option} {oIndex === q.correctAnswer && '✓ Correct'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
