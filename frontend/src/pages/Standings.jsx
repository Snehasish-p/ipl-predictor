import { useEffect, useState } from 'react';
import api from '../api/api';

export default function Standings() {
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    api.get('/standings').then(({ data }) => setStandings(data));
  }, []);

  return (
    <div className="page">
      <h2>🏆 Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th><th>Participant</th>
            <th>✅ Correct</th><th>❌ Wrong</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((user, i) => (
            <tr key={user.id} className={i === 0 ? 'leader' : ''}>
              <td>{i + 1}</td>
              <td>{user.name}</td>
              <td>{user.wins}</td>
              <td>{user.losses}</td>
              <td>{user.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}