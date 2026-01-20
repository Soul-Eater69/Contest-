import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { contestAPI } from '../lib/api';
import { format } from 'date-fns';

export default function Home() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    fetchContests();
  }, [filter]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const response = await contestAPI.getAllContests(filter === 'all' ? null : filter);
      setContests(response.data);
    } catch (error) {
      console.error('Error fetching contests:', error);
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

  return (
    <Layout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '600' }}>All Contests</h2>
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-control"
              style={{ width: '200px' }}
            >
              <option value="all">All Contests</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading contests...</div>
        ) : contests.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#666' }}>No contests found</p>
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
                  <p>Created by: {contest.createdBy?.username}</p>
                  <p>Questions: {contest.questions?.length}</p>
                  <p>Duration: {contest.duration} minutes</p>
                  <p>Start: {format(new Date(contest.startTime), 'PPp')}</p>
                  <p>End: {format(new Date(contest.endTime), 'PPp')}</p>
                </div>
                <button
                  onClick={() => router.push(`/contest/${contest._id}`)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  View Contest
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
