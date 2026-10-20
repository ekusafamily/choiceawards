import { Link } from 'react-router-dom';
import { User, Trophy, Lock } from 'lucide-react';
import { useVotingStatus } from '../utils/votingDeadline';

export default function NomineeCard({ nominee, onVote }) {
  const { isVotingClosed } = useVotingStatus();
  const rank = nominee.position || nominee.rank;

  return (
    <div className="nominee-card" id={`nominee-${nominee.id}`}>
      {/* Clickable photo+info area → profile */}
      <Link to={`/nominees/${nominee.id}`} className="nominee-card-link">
        <div style={{ position: 'relative' }}>
          {nominee.photo_url ? (
            <img
              src={nominee.photo_url}
              alt={nominee.name}
              className="nominee-card-photo"
              loading="lazy"
            />
          ) : (
            <div
              className="nominee-card-photo"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <User size={64} color="var(--color-border)" />
            </div>
          )}
          {rank && (
            <span
              className="nominee-card-rank-badge"
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: rank === 1 ? 'var(--color-gold)' : rank === 2 ? '#64748B' : rank === 3 ? '#CD7F32' : 'rgba(0,0,0,0.7)',
                color: rank === 1 ? '#1A1A1A' : '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                letterSpacing: '0.5px',
              }}
            >
              Rank #{rank}
            </span>
          )}
        </div>
        <div className="nominee-card-body">
          <h4>{nominee.name}</h4>
          <p className="nominee-course">
            {nominee.course || 'Course not specified'}
            {nominee.year_of_study
              ? ` • ${nominee.year_of_study.replace(/^year\s*/i, 'Year ')}`
              : ''}
          </p>

          <div className="nominee-card-points">
            <div>
              <span className="points-label">{isVotingClosed ? 'Tally Status' : 'Points'}</span>
            </div>
            {isVotingClosed ? (
              <span className="points-hidden-badge" title="Point counts are hidden while final tallies are audited">
                <Lock size={12} className="inline-icon" /> Locked
              </span>
            ) : (
              <span className="points-value">
                {(nominee.total_points || 0).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>

      {onVote && (
        <div className="nominee-card-vote">
          {isVotingClosed ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm nominee-vote-btn is-closed"
              disabled
              title="Voting closed at Tuesday midnight"
            >
              <Lock size={12} />
              Closed
            </button>
          ) : (
            <button
              className="btn btn-gold btn-sm nominee-vote-btn"
              onClick={() => onVote(nominee)}
              id={`vote-btn-${nominee.id}`}
            >
              <Trophy size={13} />
              Vote
            </button>
          )}
        </div>
      )}
    </div>
  );
}

