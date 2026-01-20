import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import { contestAPI } from '../../../lib/api';
import { format } from 'date-fns';

export default function Leaderboard() {
  const router = useRouter();
  const { id } = router.query;

  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  useEffect(() => {
    if (!autoRefresh || !id) return;

    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [id, autoRefresh]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchContest(), fetchLeaderboard()]);
    setLoading(false);
  };

  const fetchContest = async () => {
    try {
      const response = await contestAPI.getContestById(id);
      setContest(response.data);
    } catch (error) {
      console.error('Error fetching contest:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await contestAPI.getLeaderboard(id);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading leaderboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 className="card-title" style={{ fontSize: '28px', marginBottom: '10px' }}>
                Leaderboard
              </h2>
              {contest && (
                <p style={{ color: '#666' }}>
                  {contest.title}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
              <button onClick={() => router.push(`/contest/${id}`)} className="btn btn-secondary">
                Back to Contest
              </button>
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="alert alert-info">
              No submissions yet. Be the first to complete the contest!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Rank</th>
                    <th>Username</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th style={{ textAlign: 'center' }}>Correct</th>
                    <th style={{ textAlign: 'center' }}>Wrong</th>
                    <th style={{ textAlign: 'center' }}>Time Taken</th>
                    <th style={{ textAlign: 'center' }}>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((result, index) => (
                    <tr key={result._id} className={getRankClass(result.rank || index + 1)}>
                      <td style={{ fontWeight: '600', fontSize: '18px' }}>
                        {result.rank || index + 1}
                        {(result.rank || index + 1) === 1 && ' 🥇'}
                        {(result.rank || index + 1) === 2 && ' 🥈'}
                        {(result.rank || index + 1) === 3 && ' 🥉'}
                      </td>
                      <td style={{ fontWeight: '500' }}>{result.user?.username}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600', color: '#007bff' }}>
                        {result.totalScore}
                      </td>
                      <td style={{ textAlign: 'center', color: '#28a745' }}>
                        {result.correctAnswers}
                      </td>
                      <td style={{ textAlign: 'center', color: '#dc3545' }}>
                        {result.wrongAnswers}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {formatTime(result.timeTaken)}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '14px' }}>
                        {format(new Date(result.submittedAt), 'PPp')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {contest && (
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
                Contest Statistics
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Total Participants</p>
                  <p style={{ fontSize: '24px', fontWeight: '600' }}>{leaderboard.length}</p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Total Questions</p>
                  <p style={{ fontSize: '24px', fontWeight: '600' }}>{contest.questions?.length}</p>
                </div>
                <div>
                  <p style={{ color: '#666', fontSize: '14px' }}>Total Points</p>
                  <p style={{ fontSize: '24px', fontWeight: '600' }}>
                    {contest.questions?.reduce((sum, q) => sum + q.points, 0)}
                  </p>
                </div>
                {leaderboard.length > 0 && (
                  <>
                    <div>
                      <p style={{ color: '#666', fontSize: '14px' }}>Highest Score</p>
                      <p style={{ fontSize: '24px', fontWeight: '600', color: '#28a745' }}>
                        {Math.max(...leaderboard.map(r => r.totalScore))}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#666', fontSize: '14px' }}>Average Score</p>
                      <p style={{ fontSize: '24px', fontWeight: '600', color: '#007bff' }}>
                        {Math.round(leaderboard.reduce((sum, r) => sum + r.totalScore, 0) / leaderboard.length)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
