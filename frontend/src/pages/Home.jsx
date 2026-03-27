import { useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [match, setMatch]         = useState(null);
  const [mySelections, setMySelections] = useState([]);
  const [status, setStatus]       = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([api.get('/matches/today'), api.get('/selections/my')])
      .then(([matchRes, selRes]) => {
        setMatch(matchRes.data);
        setMySelections(selRes.data);
      })
      .catch(() => {}) // No match today is fine
      .finally(() => setLoading(false));
  }, []);

  const todaySelection = match
    ? mySelections.find(s => s.matchId === match.id)
    : null;

  const handlePick = async (team) => {
    try {
      await api.post('/selections', { matchId: match.id, selectedTeam: team });
      setStatus(`✅ You picked ${team}!`);
      // Refresh selections
      const { data } = await api.get('/selections/my');
      setMySelections(data);
    } catch (err) {
      setStatus(err.response?.data?.error || 'Selection failed');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="page">
      <h2>Welcome, {user.name}! 🏏</h2>

      {!match ? (
        <p>No match scheduled for today. Check back tomorrow!</p>
      ) : (
        <div className="match-card">
          <h3>Today's Match</h3>
          <p className="venue">{match.venue}</p>
          <div className="teams">
            {[match.team1, match.team2].map(team => (
              <button
                key={team}
                onClick={() => handlePick(team)}
                disabled={!!todaySelection || match.isComplete}
                className={todaySelection?.selectedTeam === team ? 'selected' : ''}
              >
                {team}
              </button>
            ))}
          </div>
          {todaySelection && (
            <p className="picked">
              Your pick: <strong>{todaySelection.selectedTeam}</strong>
              {todaySelection.isCorrect === true  && ' ✅ Correct!'}
              {todaySelection.isCorrect === false && ' ❌ Wrong'}
              {todaySelection.isCorrect === null  && ' ⏳ Awaiting result'}
            </p>
          )}
          {status && <p>{status}</p>}
        </div>
      )}
    </div>
  );
}