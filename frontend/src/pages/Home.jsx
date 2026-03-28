import { useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [match, setMatch]             = useState(null);
  const [mySelections, setMySelections] = useState([]);
  const [pendingTeam, setPendingTeam] = useState(null); // selected but not submitted
  const [status, setStatus]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [timeLeft, setTimeLeft]       = useState('');
  const [isTimeUp, setIsTimeUp]       = useState(false);

  useEffect(() => {
    Promise.all([api.get('/matches/today'), api.get('/selections/my')])
      .then(([matchRes, selRes]) => {
        setMatch(matchRes.data);
        setMySelections(selRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ⏱️ Countdown timer — updates every second
  useEffect(() => {
    if (!match) return;

    const matchTime = new Date(match.matchDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = matchTime - now;

      if (diff <= 0) {
        setIsTimeUp(true);
        setTimeLeft('');
        return;
      }

      setIsTimeUp(false);
      const hours   = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`
      );
    };

    tick(); // run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [match]);

  const todaySelection = match
    ? mySelections.find(s => s.matchId === match.id)
    : null;

  const alreadySubmitted = !!todaySelection;

  // Toggle team selection — click same team to deselect
  const handleTeamClick = (team) => {
    if (alreadySubmitted || isTimeUp) return;
    setPendingTeam(prev => prev === team ? null : team);
    setStatus('');
  };

  // Final submission
  const handleSubmit = async () => {
    if (!pendingTeam) {
      setStatus('⚠️ Please select a team first!');
      return;
    }
    try {
      await api.post('/selections', { matchId: match.id, selectedTeam: pendingTeam });
      setStatus(`✅ Your pick is locked in — ${pendingTeam}!`);
      const { data } = await api.get('/selections/my');
      setMySelections(data);
      setPendingTeam(null);
    } catch (err) {
      setStatus(err.response?.data?.error || 'Submission failed');
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Loading...</p>;

  return (
    <div className="page">
      <h2>Welcome, {user.name}! 🏏</h2>

      {!match ? (
        <div className="match-card">
          <p>No match scheduled for today. Check back tomorrow!</p>
        </div>
      ) : (
        <div className="match-card">
          <h3>Today's Match</h3>
          <p className="venue">📍 {match.venue}</p>

          {/* Match time display */}
          <p className="match-time">
            🕐 Match starts at:{' '}
            <strong>
              {new Date(match.matchDate).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </strong>
          </p>

          {/* Time status */}
          {!alreadySubmitted && (
            isTimeUp ? (
              <div className="time-over-banner">
                ⛔ Selection time is over! Match has started.
              </div>
            ) : (
              <div className="countdown-banner">
                ⏱️ Time left to pick: <strong>{timeLeft}</strong>
              </div>
            )
          )}

          {/* Team buttons */}
          {!alreadySubmitted && !isTimeUp && (
            <>
              <p className="pick-hint">
                Select your predicted winner — click again to deselect:
              </p>
              <div className="teams">
                <button
                  onClick={() => handleTeamClick(match.team1)}
                  className={pendingTeam === match.team1 ? 'selected' : ''}
                >
                  {pendingTeam === match.team1 ? '✓ ' : ''}{match.team1}
                </button>
                <button
                  onClick={() => handleTeamClick(match.team2)}
                  className={pendingTeam === match.team2 ? 'selected' : ''}
                >
                  {pendingTeam === match.team2 ? '✓ ' : ''}{match.team2}
                </button>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={!pendingTeam}
                className="submit-btn"
              >
                🔒 Lock in My Pick
              </button>
            </>
          )}

          {/* Already submitted view */}
          {alreadySubmitted && (
            <div className="submitted-view">
              <p className="pick-hint">Your locked-in prediction:</p>
              <div className="teams">
                <button
                  className={todaySelection.selectedTeam === match.team1 ? 'selected' : 'dimmed'}
                  disabled
                >
                  {todaySelection.selectedTeam === match.team1 ? '✓ ' : ''}{match.team1}
                </button>
                <button
                  className={todaySelection.selectedTeam === match.team2 ? 'selected' : 'dimmed'}
                  disabled
                >
                  {todaySelection.selectedTeam === match.team2 ? '✓ ' : ''}{match.team2}
                </button>
              </div>

              <p className="picked">
                🔒 Locked in: <strong>{todaySelection.selectedTeam}</strong>
                {todaySelection.isCorrect === true  && '  ✅ Correct!'}
                {todaySelection.isCorrect === false && '  ❌ Wrong'}
                {todaySelection.isCorrect === null  && '  ⏳ Awaiting result'}
              </p>
            </div>
          )}

          {status && (
            <p className={status.startsWith('✅') ? 'status-success' : 'status-error'}>
              {status}
            </p>
          )}
        </div>
      )}
    </div>
  );
}