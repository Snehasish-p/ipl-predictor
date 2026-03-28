import { useEffect, useState } from 'react';
import api from '../api/api';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function Standings() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/standings')
      .then(({ data }) => setStandings(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">Loading standings...</p>
    </div>
  );

  return (
    <div className="page">
      <div className="animate-in">
        <p className="page-title">Standings</p>
        <p className="page-subtitle">Based on correct predictions this season</p>
      </div>

      {standings.length === 0 ? (
        <div className="empty-state animate-in-delay">
          <div className="empty-icon">📊</div>
          <h3>No data yet</h3>
          <p>Standings will appear once predictions are evaluated</p>
        </div>
      ) : (
        <div className="animate-in-delay">
          <table className="standings-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>Participant</th>
                <th style={{ textAlign: 'center' }}>✅ Correct</th>
                <th style={{ textAlign: 'center' }}>❌ Wrong</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((user, i) => (
                <tr key={user.id} className={i === 0 ? 'leader' : ''}>
                  <td className={`rank-cell rank-${i + 1}`}>
                    {i < 3 ? RANK_MEDALS[i] : i + 1}
                  </td>
                  <td>
                    <div className="name-cell">
                      <div className="user-avatar-sm">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td className="stat-cell" style={{ textAlign: 'center' }}>
                    <span className="stat-win">{user.wins}</span>
                  </td>
                  <td className="stat-cell" style={{ textAlign: 'center' }}>
                    <span className="stat-loss">{user.losses}</span>
                  </td>
                  <td className="stat-cell">{user.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
