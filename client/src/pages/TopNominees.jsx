import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { Trophy, Medal, Star, User, Award, ChevronRight } from 'lucide-react';

const POSITION_LABELS = ['1st Place', '2nd Place', '3rd Place'];
const POSITION_COLORS = [
  { border: '#D4A017', cardClass: 'podium-gold', badgeBg: '#D4A017', badgeColor: '#1A1A1A' },
  { border: '#78909C', cardClass: 'podium-silver', badgeBg: '#64748B', badgeColor: '#FFFFFF' },
  { border: '#CD7F32', cardClass: 'podium-bronze', badgeBg: '#CD7F32', badgeColor: '#FFFFFF' },
];

function PodiumCard({ nominee, rank }) {
  const scheme = POSITION_COLORS[rank] ?? POSITION_COLORS[2];
  return (
    <Link
      to={`/nominees/${nominee.id}`}
      className={`top-nominees-podium-card ${scheme.cardClass}`}
      id={`podium-nominee-${nominee.id}`}
    >
      <div
        className="podium-rank-badge"
        style={{ background: scheme.badgeBg, color: scheme.badgeColor }}
      >
        {rank === 0 ? <Trophy size={14} /> : rank === 1 ? <Medal size={14} /> : <Star size={14} />}
        <span>{POSITION_LABELS[rank]}</span>
      </div>

      <div className="podium-avatar" style={{ borderColor: scheme.border }}>
        {nominee.photo_url ? (
          <img src={nominee.photo_url} alt={nominee.name} className="podium-img" />
        ) : (
          <div className="podium-avatar-placeholder">
            <User size={36} />
          </div>
        )}
      </div>

      <h3 className="podium-name">{nominee.name}</h3>

      {nominee.categories?.name && (
        <span className="podium-category-tag">{nominee.categories.name}</span>
      )}

      <div className="podium-points-pill">
        <Trophy size={14} />
        <span>{(nominee.total_points ?? 0).toLocaleString()} pts</span>
      </div>
    </Link>
  );
}

function NomineeRow({ nominee, rank }) {
  return (
    <Link
      to={`/nominees/${nominee.id}`}
      className="top-nominees-row"
      id={`nominee-row-${nominee.id}`}
    >
      <div className="nominee-row-rank">{rank}</div>

      <div className="nominee-row-avatar">
        {nominee.photo_url ? (
          <img src={nominee.photo_url} alt={nominee.name} className="nominee-row-img" />
        ) : (
          <div className="nominee-row-placeholder">
            <User size={18} />
          </div>
        )}
      </div>

      <div className="nominee-row-info">
        <span className="nominee-row-name">{nominee.name}</span>
        {nominee.categories?.name && (
          <span className="nominee-row-cat">{nominee.categories.name}</span>
        )}
      </div>

      <div className="nominee-row-points">
        <Trophy size={13} />
        <span>{(nominee.total_points ?? 0).toLocaleString()}</span>
      </div>

      <ChevronRight size={16} className="nominee-row-chevron" />
    </Link>
  );
}

export default function TopNominees() {
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNominees() {
      try {
        const { data } = await apiClient.get('/nominees');
        setNominees(data || []);
      } catch (err) {
        console.error('Failed to load nominees:', err);
        setError('Could not load nominees. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    fetchNominees();
  }, []);

  const podium = nominees.slice(0, 3);
  const rest = nominees.slice(3);

  return (
    <div className="top-nominees-page" id="top-nominees-page">
      <div className="top-nominees-header">
        <div className="container">
          <div className="top-nominees-header-inner">
            <Award size={36} className="header-award-icon" />
            <div>
              <h1>Top Nominees</h1>
              <p className="top-nominees-subtitle">
                Leading the race — ranked by total community votes
              </p>
            </div>
          </div>
          <hr className="gold-line" style={{ marginTop: '1.5rem' }} />
        </div>
      </div>

      <div className="container top-nominees-body">
        {loading && (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div className="empty-state" style={{ color: 'var(--color-error, #e53e3e)' }}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && nominees.length === 0 && (
          <div className="empty-state">
            <Trophy size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>No approved nominees yet. Check back soon!</p>
          </div>
        )}

        {!loading && !error && nominees.length > 0 && (
          <>
            {podium.length > 0 && (
              <section className="top-nominees-podium-section">
                <h2 className="section-label">
                  <Trophy size={18} /> Podium
                </h2>
                <div className="top-nominees-podium-grid">
                  {podium.map((nom, i) => (
                    <PodiumCard key={nom.id} nominee={nom} rank={i} />
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section className="top-nominees-list-section">
                <h2 className="section-label">
                  <Medal size={18} /> Full Rankings
                </h2>
                <div className="top-nominees-list">
                  {rest.map((nom, i) => (
                    <NomineeRow key={nom.id} nominee={nom} rank={i + 4} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
