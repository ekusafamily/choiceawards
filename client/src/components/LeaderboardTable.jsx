import { Link } from 'react-router-dom';
import { User, Trophy } from 'lucide-react';

export default function LeaderboardTable({ nominees = [], categoryName = '', onVote }) {
  if (nominees.length === 0) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-header">
          <h3>{categoryName}</h3>
        </div>
        <div className="empty-state">
          <p>No nominees yet. Be the first to nominate someone.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard" id="leaderboard">
      <div className="leaderboard-header">
        <h3>{categoryName}</h3>
        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
          {nominees.length} {nominees.length === 1 ? 'nominee' : 'nominees'}
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th style={{ width: '60px', textAlign: 'center' }}>Pos</th>
            <th>Nominee</th>
            {/* Points & Vote headers hidden during nomination period */}
            {/* <th style={{ textAlign: 'right' }}>Points</th> */}
            <th style={{ width: '180px', textAlign: 'center' }}>Status</th>
            {/* {onVote && <th style={{ width: '100px', textAlign: 'center' }}>Vote</th>} */}
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
                {/* Points cell hidden until voting commences */}
                {/* <td className="points-cell">
                  {(nominee.total_points || 0).toLocaleString()}
                </td> */}
                <td style={{ textAlign: 'center' }}>
                  <span className="table-voting-soon-badge">
                    Voting Commencing Soon
                  </span>
                </td>
                {/* Vote button commented out for nomination period */}
                {/* {onVote && (
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-gold btn-sm leaderboard-vote-btn"
                      onClick={() => onVote(nominee)}
                      id={`lb-vote-btn-${nominee.id}`}
                    >
                      <Trophy size={12} />
                      Vote
                    </button>
                  </td>
                )} */}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

