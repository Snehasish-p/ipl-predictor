import { useEffect, useState } from 'react';
import api from '../api/api';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function PointsTable() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

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

  const totalPool      = 2000;
  const investPerMatch = 200;

  return (
    <div className="page">
      <div className="animate-in">
        <p className="page-title">Points Table</p>
        <p className="page-subtitle">Season earnings and net profit</p>
      </div>

      {/* Info cards */}
      <div className="info-cards animate-in">
        <div className="info-card">
          <p className="info-card-label">Prize Pool / Match</p>
          <p className="info-card-value">₹{totalPool.toLocaleString()}</p>
        </div>
        <div className="info-card">
          <p className="info-card-label">Investment / Match</p>
          <p className="info-card-value">₹{investPerMatch}</p>
        </div>
        <div className="info-card">
          <p className="info-card-label">Participants</p>
          <p className="info-card-value">{users.length}</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state animate-in-delay">
          <div className="empty-icon">💰</div>
          <h3>No points yet</h3>
          <p>Points will appear once match results are updated</p>
        </div>
      ) : (
        <div className="animate-in-delay">
          <table className="points-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Participant</th>
                <th style={{ textAlign: 'right' }}>Matches</th>
                <th style={{ textAlign: 'right' }}>Points Earned</th>
                <th style={{ textAlign: 'right' }}>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id}>
                  {/* Rank */}
                  <td style={{
                    fontFamily: 'Bebas Neue',
                    fontSize: '1.2rem',
                    color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c2e' : 'var(--text-muted)'
                  }}>
                    {i < 3 ? RANK_MEDALS[i] : i + 1}
                  </td>

                  {/* Name */}
                  <td>
                    <div className="name-cell">
                      <div className="user-avatar-sm">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      {u.name}
                    </div>
                  </td>

                  {/* Matches played */}
                  <td style={{
                    textAlign: 'right',
                    fontFamily: 'Rajdhani',
                    fontWeight: 600,
                    color: 'var(--text-muted)'
                  }}>
                    {u.matchesPlayed}
                  </td>

                  {/* Points earned */}
                  <td style={{
                    textAlign: 'right',
                    fontFamily: 'Rajdhani',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    color: 'var(--gold)'
                  }}>
                    ₹{Number(u.points || 0).toFixed(0)}
                  </td>

                  {/* Net profit */}
                  <td style={{
                    textAlign: 'right',
                    fontFamily: 'Rajdhani',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    color: u.profit > 0
                      ? 'var(--green)'
                      : u.profit < 0
                      ? 'var(--red)'
                      : 'var(--text-muted)'
                  }}>
                    {u.profit > 0 ? '+' : ''}₹{Number(u.profit).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div className="profit-legend">
            <span className="legend-item">
              <span className="legend-dot legend-green" />
              Profit = Points Earned − (₹{investPerMatch} × Matches Played)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}