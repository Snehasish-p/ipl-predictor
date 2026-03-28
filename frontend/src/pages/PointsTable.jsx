import { useEffect, useState } from "react";
import api from "../api/api";

export default function PointsTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setError('Failed to load points table'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>;
  if (error)   return <p style={{ padding: '2rem', color: 'red' }}>{error}</p>;

  return (
    <div className="page">
      <h2>💰 Points Table</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Participant</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, index) => (
            <tr key={u.id} className={index === 0 ? 'leader' : ''}>
              <td>{index + 1}</td>
              <td>{u.name}</td>
              <td>₹{u.points.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}