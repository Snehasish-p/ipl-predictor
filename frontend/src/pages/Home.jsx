import { useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [match, setMatch]               = useState(null);
  const [mySelections, setMySelections] = useState([]);
  const [pendingTeam, setPendingTeam]   = useState(null);
  const [isEditing, setIsEditing]       = useState(false);
  const [status, setStatus]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [timeLeft, setTimeLeft]         = useState('');
  const [isTimeUp, setIsTimeUp]         = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchRes, selRes] = await Promise.all([
        api.get('/matches/today'),
        api.get('/selections/my')
      ]);
      setMatch(matchRes.data);
      setMySelections(selRes.data);
    } catch {
      // No match today is fine
    } finally {
      setLoading(false);
    }
  };

  // Live countdown
  useEffect(() => {
    if (!match) return;
    const matchTime = new Date(match.matchDate).getTime();

    const tick = () => {
      const diff = matchTime - Date.now();
      if (diff <= 0) {
        setIsTimeUp(true);
        setTimeLeft('');
        setIsEditing(false); // cancel editing if time runs out
        return;
      }
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

  const todaySelection   = match ? mySelections.find(s => s.matchId === match.id) : null;
  const alreadySubmitted = !!todaySelection;
  const canEdit          = alreadySubmitted && !isTimeUp && !match?.isComplete;

  // Toggle pending team selection
  const handleTeamClick = (team) => {
    if (isTimeUp) return;
    if (!isEditing && alreadySubmitted) return;
    setPendingTeam(prev => prev === team ? null : team);
    setStatus('');
  };

  // Enter edit mode
  const handleEditClick = () => {
    setIsEditing(true);
    setPendingTeam(todaySelection.selectedTeam); // pre-select current choice
    setStatus('');
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditing(false);
    setPendingTeam(null);
    setStatus('');
  };

  // Submit new selection
  const handleSubmit = async () => {
    if (!pendingTeam) { setStatus('⚠ Please select a team first.'); return; }
    try {
      await api.post('/selections', { matchId: match.id, selectedTeam: pendingTeam });
      setStatus('Your pick is locked in!');
      setIsEditing(false);
      setPendingTeam(null);
      await fetchData();
    } catch (err) {
      setStatus(err.response?.data?.error || 'Submission failed.');
    }
  };

  // Update existing selection
  const handleUpdate = async () => {
    if (!pendingTeam) { setStatus('⚠ Please select a team first.'); return; }
    if (pendingTeam === todaySelection?.selectedTeam) {
      setStatus('⚠ You selected the same team. No change needed.');
      return;
    }
    try {
      await api.patch(`/selections/${match.id}`, { selectedTeam: pendingTeam });
      setStatus(`Selection updated to ${pendingTeam}!`);
      setIsEditing(false);
      setPendingTeam(null);
      await fetchData();
    } catch (err) {
      setStatus(err.response?.data?.error || 'Update failed.');
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
        weekday: 'short', day: 'numeric', month: 'short',
        hour: '2-digit', minute: '2-digit', hour12: true
      })
    : '';

  // What teams to highlight in the UI
  const getTeamClass = (team) => {
    if (isEditing || (!alreadySubmitted && !isTimeUp)) {
      // Selection mode
      return pendingTeam === team ? 'selected' : '';
    }
    if (alreadySubmitted) {
      // Locked view
      return todaySelection.selectedTeam === team ? 'selected' : 'dimmed';
    }
    return '';
  };

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

            {/* Status banners */}
            {!alreadySubmitted && !isTimeUp && (
              <div className="banner banner-countdown">
                ⏱ <span>Time left to pick: <strong>{timeLeft}</strong></span>
              </div>
            )}

            {!alreadySubmitted && isTimeUp && (
              <div className="banner banner-timeover">
                ⛔ <span>Selection closed — match has already started</span>
              </div>
            )}

            {alreadySubmitted && !isEditing && !isTimeUp && !match.isComplete && (
              <div className="banner banner-locked" style={{ justifyContent: 'space-between' }}>
                <span>🔒 Locked in — <strong>{todaySelection.selectedTeam}</strong> &nbsp;·&nbsp; <span style={{ fontWeight: 400 }}>Time left: {timeLeft}</span></span>
                <button
                  onClick={handleEditClick}
                  className="btn-edit"
                >
                  ✏️ Edit Pick
                </button>
              </div>
            )}

            {alreadySubmitted && isEditing && (
              <div className="banner banner-editing">
                ✏️ <span>Edit mode — select a new team below and confirm</span>
              </div>
            )}

            {alreadySubmitted && isTimeUp && (
              <div className="banner banner-locked">
                🔒 <span>Your prediction is locked in for this match</span>
              </div>
            )}

            {/* Pick hint */}
            {(!alreadySubmitted || isEditing) && !isTimeUp && (
              <p className="pick-hint">
                {isEditing
                  ? `Currently: ${todaySelection?.selectedTeam} — select a new team to change`
                  : 'Select your predicted winner — tap again to deselect'}
              </p>
            )}

            {/* Team buttons */}
            <div className="vs-row">
              {/* Team 1 */}
              <button
                className={`team-btn ${getTeamClass(match.team1)} ${match.winnerTeam === match.team1 ? 'winner' : ''}`}
                onClick={() => handleTeamClick(match.team1)}
                disabled={(alreadySubmitted && !isEditing) || isTimeUp}
              >
                {((isEditing || !alreadySubmitted) && pendingTeam === match.team1) && (
                  <span className="team-check">✓</span>
                )}
                {alreadySubmitted && !isEditing && todaySelection.selectedTeam === match.team1 && (
                  <span className="team-check">✓</span>
                )}
                <span className="team-name">{match.team1}</span>
              </button>

              <span className="vs-label">VS</span>

              {/* Team 2 */}
              <button
                className={`team-btn ${getTeamClass(match.team2)} ${match.winnerTeam === match.team2 ? 'winner' : ''}`}
                onClick={() => handleTeamClick(match.team2)}
                disabled={(alreadySubmitted && !isEditing) || isTimeUp}
              >
                {((isEditing || !alreadySubmitted) && pendingTeam === match.team2) && (
                  <span className="team-check">✓</span>
                )}
                {alreadySubmitted && !isEditing && todaySelection.selectedTeam === match.team2 && (
                  <span className="team-check">✓</span>
                )}
                <span className="team-name">{match.team2}</span>
              </button>
            </div>

            {/* Action buttons */}
            {!alreadySubmitted && !isTimeUp && (
              <button
                className="btn-submit"
                onClick={handleSubmit}
                disabled={!pendingTeam}
              >
                {pendingTeam ? `🔒 Lock in — ${pendingTeam}` : 'Select a team to continue'}
              </button>
            )}

            {isEditing && (
              <div className="edit-actions">
                <button
                  className="btn-submit"
                  onClick={handleUpdate}
                  disabled={!pendingTeam}
                  style={{ flex: 1 }}
                >
                  {pendingTeam && pendingTeam !== todaySelection?.selectedTeam
                    ? `✅ Confirm — ${pendingTeam}`
                    : 'Select a different team'}
                </button>
                <button
                  className="btn-cancel"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Result after submission */}
            {alreadySubmitted && !isEditing && (
              <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Rajdhani', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Your pick: <strong style={{ color: 'var(--text-primary)' }}>{todaySelection.selectedTeam}</strong>
                </span>
                {todaySelection.isCorrect === true  && <span className="result-badge badge-correct">✓ Correct</span>}
                {todaySelection.isCorrect === false && <span className="result-badge badge-wrong">✗ Wrong</span>}
                {todaySelection.isCorrect === null  && !isTimeUp && <span className="result-badge badge-pending">⏳ Awaiting Result</span>}
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