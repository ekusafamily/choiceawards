import { Link } from 'react-router-dom';
import { User, Trophy, Clock } from 'lucide-react';

export default function NomineeCard({ nominee, onVote }) {
  return (
    <div className="nominee-card" id={`nominee-${nominee.id}`}>
      {/* Clickable photo+info area → profile */}
      <Link to={`/nominees/${nominee.id}`} className="nominee-card-link">
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
        <div className="nominee-card-body">
          <h4>{nominee.name}</h4>
          <p className="nominee-course">
            {nominee.course || 'Course not specified'}
            {nominee.year_of_study
              ? ` • ${nominee.year_of_study.replace(/^year\s*/i, 'Year ')}`
              : ''}
          </p>

          {/* Points tally - hidden until voting commences */}
          {/* <div className="nominee-card-points">
            <div>
              <span className="points-label">Points</span>
            </div>
            <span className="points-value">
              {(nominee.total_points || 0).toLocaleString()}
            </span>
          </div> */}
        </div>
      </Link>

      {/* Vote button commented out for nomination period */}
      {/* {onVote && (
        <div className="nominee-card-vote">
          <button
            className="btn btn-gold btn-sm nominee-vote-btn"
            onClick={() => onVote(nominee)}
            id={`vote-btn-${nominee.id}`}
          >
            <Trophy size={13} />
            Vote
          </button>
        </div>
      )} */}

      <div className="nominee-card-vote">
        <div className="voting-soon-badge" id={`voting-soon-${nominee.id}`}>
          <Clock size={12} />
          <span>Voting Commencing Soon</span>
        </div>
      </div>
    </div>
  );
}

