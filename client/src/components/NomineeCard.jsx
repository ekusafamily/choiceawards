import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

export default function NomineeCard({ nominee }) {
  return (
    <Link
      to={`/nominees/${nominee.id}`}
      className="nominee-card"
      id={`nominee-${nominee.id}`}
    >
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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <User size={64} color="var(--color-border)" />
        </div>
      )}
      <div className="nominee-card-body">
        <h4>{nominee.name}</h4>
        <p className="nominee-course">
          {nominee.course || 'Course not specified'}
          {nominee.year_of_study ? ` • ${nominee.year_of_study.replace(/^year\s*/i, 'Year ')}` : ''}
        </p>
        <div className="nominee-card-points">
          <div>
            <span className="points-label">Points</span>
          </div>
          <span className="points-value">
            {(nominee.total_points || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
