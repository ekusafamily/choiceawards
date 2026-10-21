import { Link } from 'react-router-dom';
import { User, Trophy, Lock, ShieldCheck, MapPin } from 'lucide-react';
import { useVotingStatus } from '../utils/votingDeadline';

export default function LeaderboardTable({ nominees = [], categoryName = '', onVote }) {
  const { isVotingClosed } = useVotingStatus();

  if (nominees.length === 0) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">
          <h3>{categoryName}</h3>
        </div>
        <div className="empty-state ceremony-empty-verification-state" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
          <ShieldCheck size={36} style={{ color: 'var(--color-accent, #D4A017)', margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.15rem', color: 'var(--color-primary, #1B5E20)', marginBottom: '8px' }}>
            Category Verification In Progress
          </h4>
          <p style={{ maxWidth: '520px', margin: '0 auto 14px', lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
            All cast votes for <strong>{categoryName}</strong> are currently being audited by the DeKUTSO Committee. 
            Winners will be awarded live at <strong>Freedom Hall</strong> (dates yet to be communicated).
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-accent, #D4A017)', fontWeight: 600 }}>
            <MapPin size={14} /> Ceremony Venue: Freedom Hall
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard" id="leaderboard">
      <div className="leaderboard-header">
        <div>
          <h3>{categoryName}</h3>
          {isVotingClosed && (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-gold)', display: 'block', marginTop: 2 }}>
              <Lock size={12} className="inline-icon" /> Voting closed • Ranks preserved, points hidden for audit
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
          {nominees.length} {nominees.length === 1 ? 'nominee' : 'nominees'}
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '60px', textAlign: 'center' }}>Pos</th>
            <th>Nominee</th>
            <th style={{ textAlign: 'right' }}>{isVotingClosed ? 'Tallies' : 'Points'}</th>
            {onVote && <th style={{ width: '100px', textAlign: 'center' }}>Vote</th>}
          </tr>
        </thead>
        <tbody>
          {nominees.map((nominee, index) => {
            const position = nominee.position || index + 1;
            let posClass = '';
            if (position === 1) posClass = 'position-1';
            else if (position === 2) posClass = 'position-2';
            else if (position === 3) posClass = 'position-3';

            return (
              <tr key={nominee.id}>
                <td className={`position-cell ${posClass}`}>
                  {position}
                </td>
                <td>
                  <Link to={`/nominees/${nominee.id}`} className="nominee-cell-link">
                    <div className="nominee-cell">
                      {nominee.photo_url ? (
                        <img src={nominee.photo_url} alt={nominee.name} />
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'var(--color-bg-alt)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <User size={20} color="var(--color-border)" />
                        </div>
                      )}
                      <div>
                        <strong>{nominee.name}</strong>
                        {nominee.course && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {nominee.course}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="points-cell">
                  {isVotingClosed ? (
                    <span className="points-hidden-badge" title="Point counts are hidden while final tallies are audited">
                      <Lock size={12} className="inline-icon" /> Locked
                    </span>
                  ) : (
                    (nominee.total_points || 0).toLocaleString()
                  )}
                </td>
                {onVote && (
                  <td style={{ textAlign: 'center' }}>
                    {isVotingClosed ? (
                      <span
                        className="nominee-vote-btn is-closed"
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Lock size={11} /> Closed
                      </span>
                    ) : (
                      <button
                        className="btn btn-gold btn-sm leaderboard-vote-btn"
                        onClick={() => onVote(nominee)}
                        id={`lb-vote-btn-${nominee.id}`}
                      >
                        <Trophy size={12} />
                        Vote
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

