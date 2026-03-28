import { useEffect, useState } from 'react';
import api from '../api/api';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function PointsTable() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    api.get('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setError('Failed to load points table'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">Loading points table...</p>
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
      </div>
    </div>
  );

  const totalPool = 2000;

  return (
    <div className="page">
      <div className="animate-in">
        <p className="page-title">Points Table</p>
        <p className="page-subtitle">Season earnings from correct predictions</p>
      </div>

      {users.length === 0 ? (
        <div className="empty-state animate-in-delay">
          <div className="empty-icon">💰</div>
          <h3>No points yet</h3>
          <p>Points will be awarded once match results are updated</p>
        </div>
      ) : (
        <div className="animate-in-delay">

          {/* Pool info card */}
          <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: 'Rajdhani', fontSize: '0.8rem', letterSpacing: '1px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Daily Prize Pool
              </p>
              <p style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '2px', color: 'var(--gold)', lineHeight: 1 }}>
                ₹{totalPool.toLocaleString()}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'Rajdhani', fontSize: '0.8rem', letterSpacing: '1px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Participants
              </p>
              <p style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '2px', color: 'var(--text-primary)', lineHeight: 1 }}>
                {users.length}
              </p>
            </div>
          </div>

          <table className="points-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Participant</th>
                <th style={{ textAlign: 'right' }}>Points Earned</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  <td style={{
                    fontFamily: 'Bebas Neue',
                    fontSize: '1.2rem',
                    color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c2e' : 'var(--text-muted)'
                  }}>
                    {i < 3 ? RANK_MEDALS[i] : i + 1}
                  </td>
                  <td>
                    <div className="name-cell">
                      <div className="user-avatar-sm">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td>₹{Number(u.points || 0).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
