import { useEffect, useState } from 'react';
import api from '../api/api';

export default function SelectionsOverview() {
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('all'); // all | completed | upcoming

  useEffect(() => {
    api.get('/matches/selections-overview')
      .then(({ data }) => setMatches(data))
      .catch(() => setError('Failed to load selections'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

  const filtered = matches.filter(m => {
    if (filter === 'completed') return m.isComplete;
    if (filter === 'upcoming')  return !m.isComplete;
    return true;
  });

  // Only show matches that have selections
  const withSelections    = filtered.filter(m => m.selections.length > 0);
  const withoutSelections = filtered.filter(m => m.selections.length === 0);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">Loading selections...</p>
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

  return (
    <div className="page">
      <div className="animate-in">
        <p className="page-title">Selections</p>
        <p className="page-subtitle">Who picked what team for every match</p>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs animate-in">
        {['all', 'completed', 'upcoming'].map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all'       ? '🏏 All Matches' : ''}
            {f === 'completed' ? '✅ Completed'   : ''}
            {f === 'upcoming'  ? '📅 Upcoming'    : ''}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      {withSelections.length > 0 && (
        <div className="sel-summary animate-in">
          <span>{withSelections.length} match{withSelections.length !== 1 ? 'es' : ''} with picks</span>
          <span>·</span>
          <span>{withoutSelections.length} without picks</span>
        </div>
      )}

      {/* No data */}
      {withSelections.length === 0 && (
        <div className="empty-state animate-in-delay">
          <div className="empty-icon">🗳️</div>
          <h3>No selections yet</h3>
          <p>Selections will appear here once participants start picking teams</p>
        </div>
      )}

      {/* Match cards */}
      <div className="animate-in-delay">
        {withSelections.map((match, idx) => {
          const team1Count = match.selections.filter(s => s.selectedTeam === match.team1).length;
          const team2Count = match.selections.filter(s => s.selectedTeam === match.team2).length;
          const total      = match.selections.length;

          return (
            <div key={match.id} className="sel-match-card">

              {/* Match header */}
              <div className="sel-match-header">
                <div className="sel-match-info">
                  <span className="sel-match-number">Match {idx + 1}</span>
                  <span className="sel-teams-label">
                    {match.team1} <span style={{ color: 'var(--text-muted)' }}>vs</span> {match.team2}
                  </span>
                  <span className="sel-match-date">{formatDate(match.matchDate)}</span>
                </div>

                <div className="sel-match-right">
                  {match.isComplete && match.winnerTeam && (
                    <span className="winner-pill">🏆 {match.winnerTeam} won</span>
                  )}
                  {!match.isComplete && (
                    <span className="result-badge badge-pending">⏳ Upcoming</span>
                  )}
                  <span className="sel-count-badge">{total} picks</span>
                </div>
              </div>

              {/* Team split bar */}
              <div className="split-bar-container">
                <div className="split-bar-label">
                  <span style={{ color: match.winnerTeam === match.team1 ? 'var(--green)' : 'var(--text-secondary)' }}>
                    {match.team1}
                    {match.winnerTeam === match.team1 && ' 🏆'}
                  </span>
                  <span style={{ color: match.winnerTeam === match.team2 ? 'var(--green)' : 'var(--text-secondary)' }}>
                    {match.team2}
                    {match.winnerTeam === match.team2 && ' 🏆'}
                  </span>
                </div>
                <div className="split-bar">
                  <div
                    className="split-bar-fill team1-fill"
                    style={{ width: total > 0 ? `${(team1Count / total) * 100}%` : '50%' }}
                  />
                  <div
                    className="split-bar-fill team2-fill"
                    style={{ width: total > 0 ? `${(team2Count / total) * 100}%` : '50%' }}
                  />
                </div>
                <div className="split-bar-counts">
                  <span>{team1Count} picked ({total > 0 ? Math.round((team1Count/total)*100) : 0}%)</span>
                  <span>{team2Count} picked ({total > 0 ? Math.round((team2Count/total)*100) : 0}%)</span>
                </div>
              </div>

              {/* Selections table */}
              <table className="sel-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Participant</th>
                    <th>Team Selected</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {match.selections
                    .sort((a, b) => a.userName.localeCompare(b.userName))
                    .map((sel, i) => (
                      <tr key={sel.userId} className={
                        sel.isCorrect === true  ? 'sel-row-correct' :
                        sel.isCorrect === false ? 'sel-row-wrong'   : ''
                      }>
                        <td className="sel-rank">{i + 1}</td>
                        <td>
                          <div className="name-cell">
                            <div className="user-avatar-sm">
                              {sel.userName?.[0]?.toUpperCase()}
                            </div>
                            {sel.userName}
                          </div>
                        </td>
                        <td>
                          <span className={`team-badge ${
                            match.winnerTeam === sel.selectedTeam ? 'team-badge-winner' :
                            match.isComplete ? 'team-badge-loser' : 'team-badge-neutral'
                          }`}>
                            {sel.selectedTeam}
                          </span>
                        </td>
                        <td>
                          {sel.isCorrect === true  && <span className="result-badge badge-correct">✓ Correct</span>}
                          {sel.isCorrect === false && <span className="result-badge badge-wrong">✗ Wrong</span>}
                          {sel.isCorrect === null  && <span className="result-badge badge-pending">⏳ Pending</span>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

            </div>
          );
        })}
      </div>
    </div>
  );
}