import { useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';


export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pendingTeam, setPendingTeam] = useState({}); // { matchId: team }
  const [status, setStatus]         = useState({});   // { matchId: message }
  const [now, setNow]               = useState(new Date());

  useEffect(() => {
    fetchMatches();
    // Update clock every second for live cutoff checking
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchMatches = async () => {
    try {
      const { data } = await api.get('/matches/upcoming');
      setMatches(data);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = (matchId, team) => {
    setPendingTeam(prev => ({
      ...prev,
      [matchId]: prev[matchId] === team ? null : team
    }));
    setStatus(prev => ({ ...prev, [matchId]: '' }));
  };

  const handleSubmit = async (match) => {
    const team = pendingTeam[match.id];
    if (!team) {
      setStatus(prev => ({ ...prev, [match.id]: '⚠ Select a team first' }));
      return;
    }
    try {
      await api.post('/selections', { matchId: match.id, selectedTeam: team });
      setStatus(prev => ({ ...prev, [match.id]: `✅ Locked in — ${team}!` }));
      setPendingTeam(prev => ({ ...prev, [match.id]: null }));
      fetchMatches(); // refresh to show updated selection
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        [match.id]: err.response?.data?.error || 'Failed. Try again.'
      }));
    }
  };

  const getMatchStatus = (match) => {
    const matchTime = new Date(match.matchDate);
    if (match.isComplete)        return 'completed';
    if (now >= matchTime)        return 'live';
    return 'upcoming';
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const t = new Date();
    return d.getUTCFullYear() === t.getUTCFullYear() &&
           d.getUTCMonth()    === t.getUTCMonth() &&
           d.getUTCDate()     === t.getUTCDate();
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">Loading matches...</p>
    </div>
  );

  const upcoming  = matches.filter(m => getMatchStatus(m) === 'upcoming');
  const live      = matches.filter(m => getMatchStatus(m) === 'live');
  const completed = matches.filter(m => getMatchStatus(m) === 'completed');

  return (
    <div className="page">
      <div className="animate-in">
        <p className="page-title">All Matches</p>
        <p className="page-subtitle">Pick your winner before each match begins</p>
      </div>

      {matches.length === 0 && (
        <div className="empty-state animate-in-delay">
          <div className="empty-icon">🏟️</div>
          <h3>No Matches Scheduled</h3>
          <p>Check back soon for upcoming fixtures</p>
        </div>
      )}

      {/* Live / Started matches */}
      {live.length > 0 && (
        <div className="matches-section animate-in-delay">
          <div className="section-label section-label-live">🔴 In Progress</div>
          {live.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              status="live"
              isToday={isToday(match.matchDate)}
              pendingTeam={pendingTeam[match.id]}
              statusMsg={status[match.id]}
              onTeamClick={handleTeamClick}
              onSubmit={handleSubmit}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Upcoming matches */}
      {upcoming.length > 0 && (
        <div className="matches-section animate-in-delay">
          <div className="section-label section-label-upcoming">📅 Upcoming</div>
          {upcoming.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              status="upcoming"
              isToday={isToday(match.matchDate)}
              pendingTeam={pendingTeam[match.id]}
              statusMsg={status[match.id]}
              onTeamClick={handleTeamClick}
              onSubmit={handleSubmit}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Completed matches */}
      {completed.length > 0 && (
        <div className="matches-section animate-in-delay">
          <div className="section-label section-label-done">✅ Completed</div>
          {completed.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              status="completed"
              isToday={isToday(match.matchDate)}
              pendingTeam={pendingTeam[match.id]}
              statusMsg={status[match.id]}
              onTeamClick={handleTeamClick}
              onSubmit={handleSubmit}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Match Card Component ───────────────────────────────────────────────────
// Replace the entire MatchCard function with this updated version:
function MatchCard({ match, status, isToday, pendingTeam, statusMsg, onTeamClick, onSubmit, formatDate }) {
  const [isEditing, setIsEditing]       = useState(false);
  const [editTeam, setEditTeam]         = useState(null);
  const [editStatus, setEditStatus]     = useState('');

  const hasSelection  = !!match.userSelection;
  const selectedTeam  = match.userSelection?.selectedTeam;
  const isCorrect     = match.userSelection?.isCorrect;
  const pending       = pendingTeam;
  const now           = new Date();
  const matchTime     = new Date(match.matchDate);
  const canEdit       = hasSelection && now < matchTime && !match.isComplete;

  const handleEditTeamClick = (team) => {
    setEditTeam(prev => prev === team ? null : team);
    setEditStatus('');
  };

  const handleEditSubmit = async () => {
    if (!editTeam || editTeam === selectedTeam) {
      setEditStatus('⚠ Pick a different team to update.');
      return;
    }
    try {
      await api.patch(`/selections/${match.id}`, { selectedTeam: editTeam });
      setEditStatus(`✅ Updated to ${editTeam}!`);
      setIsEditing(false);
      setEditTeam(null);
      // Refresh page data
      window.location.reload();
    } catch (err) {
      setEditStatus(err.response?.data?.error || 'Update failed.');
    }
  };

  const getTeamClass = (team) => {
    if (isEditing) return editTeam === team ? 'selected' : '';
    if (hasSelection) {
      if (selectedTeam === team) return 'selected';
      return 'dimmed';
    }
    return pending === team ? 'selected' : '';
  };

  return (
    <div className={`match-list-card ${isToday ? 'match-today' : ''} ${status === 'completed' ? 'match-completed' : ''}`}>

      {/* Header */}
      <div className="match-list-header">
        <div className="match-list-meta">
          {isToday && <span className="today-pill">TODAY</span>}
          <span className="match-list-date">{formatDate(match.matchDate)}</span>
          <span className="match-list-venue">📍 {match.venue}</span>
        </div>
        {status === 'completed' && match.winnerTeam && (
          <span className="winner-pill">🏆 {match.winnerTeam}</span>
        )}
        {status === 'live' && <span className="live-pill">🔴 LIVE</span>}
      </div>

      {/* Teams */}
      <div className="match-list-teams">
        <button
          className={`team-list-btn ${getTeamClass(match.team1)} ${match.winnerTeam === match.team1 ? 'winner' : ''}`}
          onClick={() => {
            if (isEditing) { handleEditTeamClick(match.team1); return; }
            if (status === 'upcoming' && !hasSelection) onTeamClick(match.id, match.team1);
          }}
          disabled={(!isEditing && hasSelection) || status !== 'upcoming'}
        >
          {((isEditing && editTeam === match.team1) || (!isEditing && (pending === match.team1 || (hasSelection && selectedTeam === match.team1)))) && (
            <span className="team-check">✓</span>
          )}
          <span className="team-name">{match.team1}</span>
        </button>

        <span className="vs-label">VS</span>

        <button
          className={`team-list-btn ${getTeamClass(match.team2)} ${match.winnerTeam === match.team2 ? 'winner' : ''}`}
          onClick={() => {
            if (isEditing) { handleEditTeamClick(match.team2); return; }
            if (status === 'upcoming' && !hasSelection) onTeamClick(match.id, match.team2);
          }}
          disabled={(!isEditing && hasSelection) || status !== 'upcoming'}
        >
          {((isEditing && editTeam === match.team2) || (!isEditing && (pending === match.team2 || (hasSelection && selectedTeam === match.team2)))) && (
            <span className="team-check">✓</span>
          )}
          <span className="team-name">{match.team2}</span>
        </button>
      </div>

      {/* Footer */}
      <div className="match-list-footer">

        {/* Not submitted yet */}
        {status === 'upcoming' && !hasSelection && (
          <button className="btn-submit-sm" onClick={() => onSubmit(match)} disabled={!pending}>
            {pending ? `🔒 Lock in — ${pending}` : 'Select a team above'}
          </button>
        )}

        {/* Submitted — can edit */}
        {status === 'upcoming' && hasSelection && !isEditing && (
          <div className="selection-locked">
            <span>🔒 Your pick: <strong>{selectedTeam}</strong></span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="result-badge badge-pending">⏳ Awaiting Result</span>
              {canEdit && (
                <button
                  className="btn-edit"
                  onClick={() => { setIsEditing(true); setEditTeam(selectedTeam); }}
                >
                  ✏️ Edit
                </button>
              )}
            </div>
          </div>
        )}

        {/* Edit mode */}
        {status === 'upcoming' && hasSelection && isEditing && (
          <div>
            <p className="pick-hint" style={{ marginBottom: '0.5rem' }}>
              Currently: <strong style={{ color: 'var(--gold)' }}>{selectedTeam}</strong> — pick a new team above
            </p>
            <div className="edit-actions">
              <button
                className="btn-submit-sm"
                onClick={handleEditSubmit}
                disabled={!editTeam || editTeam === selectedTeam}
                style={{ flex: 1 }}
              >
                {editTeam && editTeam !== selectedTeam ? `✅ Confirm — ${editTeam}` : 'Select different team'}
              </button>
              <button
                className="btn-cancel"
                onClick={() => { setIsEditing(false); setEditTeam(null); setEditStatus(''); }}
              >
                Cancel
              </button>
            </div>
            {editStatus && <p className={editStatus.startsWith('⚠') ? 'status-error' : 'status-success'} style={{ marginTop: '0.5rem' }}>{editStatus}</p>}
          </div>
        )}

        {/* Live */}
        {status === 'live' && !hasSelection && (
          <div className="selection-locked">
            <span style={{ color: 'var(--red)' }}>⛔ Selection closed</span>
          </div>
        )}
        {status === 'live' && hasSelection && (
          <div className="selection-locked">
            <span>🔒 Your pick: <strong>{selectedTeam}</strong></span>
            <span className="result-badge badge-pending">⏳ In progress</span>
          </div>
        )}

        {/* Completed */}
        {status === 'completed' && hasSelection && (
          <div className="selection-locked">
            <span>Your pick: <strong>{selectedTeam}</strong></span>
            {isCorrect === true  && <span className="result-badge badge-correct">✓ Correct</span>}
            {isCorrect === false && <span className="result-badge badge-wrong">✗ Wrong</span>}
            {isCorrect === null  && <span className="result-badge badge-pending">⏳ Pending</span>}
          </div>
        )}
        {status === 'completed' && !hasSelection && (
          <div className="selection-locked">
            <span style={{ color: 'var(--text-muted)' }}>You didn't pick for this match</span>
          </div>
        )}

        {statusMsg && (
          <p className={statusMsg.startsWith('⚠') ? 'status-error' : 'status-success'} style={{ marginTop: '0.5rem' }}>
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
}