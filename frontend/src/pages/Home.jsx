import { useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [match, setMatch]               = useState(null);
  const [mySelections, setMySelections] = useState([]);
  const [pendingTeam, setPendingTeam]   = useState(null);
  const [status, setStatus]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [timeLeft, setTimeLeft]         = useState('');
  const [isTimeUp, setIsTimeUp]         = useState(false);

  useEffect(() => {
    Promise.all([api.get('/matches/today'), api.get('/selections/my')])
      .then(([matchRes, selRes]) => {
        setMatch(matchRes.data);
        setMySelections(selRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ⏱️ Live countdown
  useEffect(() => {
    if (!match) return;
    const matchTime = new Date(match.matchDate).getTime();

    const tick = () => {
      const diff = matchTime - Date.now();
      if (diff <= 0) { setIsTimeUp(true); setTimeLeft(''); return; }
      setIsTimeUp(false);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [match]);

  const todaySelection  = match ? mySelections.find(s => s.matchId === match.id) : null;
  const alreadySubmitted = !!todaySelection;

  const handleTeamClick = (team) => {
    if (alreadySubmitted || isTimeUp) return;
    setPendingTeam(prev => prev === team ? null : team);
    setStatus('');
  };

  const handleSubmit = async () => {
    if (!pendingTeam) { setStatus('⚠ Please select a team first.'); return; }
    try {
      await api.post('/selections', { matchId: match.id, selectedTeam: pendingTeam });
      setStatus(`Your pick is locked in!`);
      const { data } = await api.get('/selections/my');
      setMySelections(data);
      setPendingTeam(null);
    } catch (err) {
      setStatus(err.response?.data?.error || 'Submission failed. Try again.');
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">Loading today's match...</p>
    </div>
  );

  const matchDateStr = match
    ? new Date(match.matchDate).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : '';

  return (
    <div className="page">
      {/* Welcome */}
      <div className="welcome-banner animate-in">
        <h2>Welcome back, <span>{user.name}</span></h2>
        <p>Make your prediction for today's match before it begins</p>
      </div>

      {!match ? (
        <div className="empty-state animate-in-delay">
          <div className="empty-icon">🏟️</div>
          <h3>No Match Today</h3>
          <p>Check back tomorrow for the next IPL fixture</p>
        </div>
      ) : (
        <div className="match-card animate-in-delay">

          {/* Header */}
          <div className="match-card-header">
            <span className="match-label">Today's Match</span>
            <span className="match-venue">📍 {match.venue}</span>
          </div>

          <div className="match-card-body">

            {/* Match time */}
            <div className="match-time-row">
              <span className="match-time-label">Match Start</span>
              <span className="match-time-value">🕐 {matchDateStr} IST</span>
            </div>

            {/* Time status banners */}
            {!alreadySubmitted && (
              isTimeUp ? (
                <div className="banner banner-timeover">
                  ⛔ <span>Selection closed — match has already started</span>
                </div>
              ) : (
                <div className="banner banner-countdown">
                  ⏱ <span>Time left to pick: <strong>{timeLeft}</strong></span>
                </div>
              )
            )}

            {alreadySubmitted && (
              <div className="banner banner-locked">
                🔒 <span>Your prediction is locked in for this match</span>
              </div>
            )}

            {/* Hint */}
            {!alreadySubmitted && !isTimeUp && (
              <p className="pick-hint">
                Select your predicted winner — tap again to change
              </p>
            )}

            {/* Team selector */}
            <div className="vs-row">
              {/* Team 1 */}
              <button
                className={`team-btn ${
                  alreadySubmitted
                    ? todaySelection.selectedTeam === match.team1
                      ? 'selected'
                      : 'dimmed'
                    : pendingTeam === match.team1
                    ? 'selected'
                    : ''
                } ${match.winnerTeam === match.team1 ? 'winner' : ''}`}
                onClick={() => handleTeamClick(match.team1)}
                disabled={alreadySubmitted || isTimeUp}
              >
                {(alreadySubmitted
                  ? todaySelection.selectedTeam === match.team1
                  : pendingTeam === match.team1) && (
                  <span className="team-check">✓</span>
                )}
                <span className="team-name">{match.team1}</span>
              </button>

              <span className="vs-label">VS</span>

              {/* Team 2 */}
              <button
                className={`team-btn ${
                  alreadySubmitted
                    ? todaySelection.selectedTeam === match.team2
                      ? 'selected'
                      : 'dimmed'
                    : pendingTeam === match.team2
                    ? 'selected'
                    : ''
                } ${match.winnerTeam === match.team2 ? 'winner' : ''}`}
                onClick={() => handleTeamClick(match.team2)}
                disabled={alreadySubmitted || isTimeUp}
              >
                {(alreadySubmitted
                  ? todaySelection.selectedTeam === match.team2
                  : pendingTeam === match.team2) && (
                  <span className="team-check">✓</span>
                )}
                <span className="team-name">{match.team2}</span>
              </button>
            </div>

            {/* Submit button */}
            {!alreadySubmitted && !isTimeUp && (
              <button
                className="btn-submit"
                onClick={handleSubmit}
                disabled={!pendingTeam}
              >
                {pendingTeam ? `🔒 Lock in — ${pendingTeam}` : 'Select a team to continue'}
              </button>
            )}

            {/* Result after submission */}
            {alreadySubmitted && (
              <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Rajdhani', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Your pick: <strong style={{ color: 'var(--text-primary)' }}>{todaySelection.selectedTeam}</strong>
                </span>
                {todaySelection.isCorrect === true  && <span className="result-badge badge-correct">✓ Correct</span>}
                {todaySelection.isCorrect === false && <span className="result-badge badge-wrong">✗ Wrong</span>}
                {todaySelection.isCorrect === null  && <span className="result-badge badge-pending">⏳ Awaiting Result</span>}
              </div>
            )}

            {/* Status message */}
            {status && (
              <p className={status.startsWith('⚠') ? 'status-error' : 'status-success'}>
                {status.startsWith('⚠') ? status : `✅ ${status}`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
