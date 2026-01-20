import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { contestAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function MyContests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyContests();
    }
  }, [isAuthenticated]);

  const fetchMyContests = async () => {
    try {
      setLoading(true);
      const response = await contestAPI.getMyContests();
      setContests(response.data);
    } catch (error) {
      console.error('Error fetching my contests:', error);
    } finally {
      setLoading(false);
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

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="alert alert-error">Please login to view your contests</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '30px' }}>My Contests</h2>

        {loading ? (
          <div className="loading">Loading your contests...</div>
        ) : contests.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#666' }}>
              You haven't created any contests yet.
            </p>
            <button
              onClick={() => router.push('/create-contest')}
              className="btn btn-primary"
              style={{ margin: '20px auto', display: 'block' }}
            >
              Create Your First Contest
            </button>
          </div>
        ) : (
          <div className="grid">
            {contests.map((contest) => (
              <div key={contest._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <h3 className="card-title">{contest.title}</h3>
                  <span className={`badge ${getStatusBadgeClass(contest.status)}`}>
                    {contest.status}
                  </span>
                </div>
                <p className="card-description">{contest.description}</p>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                  <p>Questions: {contest.questions?.length}</p>
                  <p>Duration: {contest.duration} minutes</p>
                  <p>Start: {format(new Date(contest.startTime), 'PPp')}</p>
                  <p>End: {format(new Date(contest.endTime), 'PPp')}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => router.push(`/contest/${contest._id}`)}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => router.push(`/contest/${contest._id}/leaderboard`)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Leaderboard
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
