import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { Trophy, Medal, Star, User, Award, ChevronRight, Lock, MapPin, ShieldCheck, Calendar, Sparkles } from 'lucide-react';
import { useVotingStatus } from '../utils/votingDeadline';

const POSITION_LABELS = ['1st Place', '2nd Place', '3rd Place'];
const POSITION_COLORS = [
  { border: '#D4A017', cardClass: 'podium-gold', badgeBg: '#D4A017', badgeColor: '#1A1A1A' },
  { border: '#78909C', cardClass: 'podium-silver', badgeBg: '#64748B', badgeColor: '#FFFFFF' },
  { border: '#CD7F32', cardClass: 'podium-bronze', badgeBg: '#CD7F32', badgeColor: '#FFFFFF' },
];

function PodiumCard({ nominee, rank, isVotingClosed }) {
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
        {isVotingClosed ? (
          <>
            <Lock size={13} />
            <span>Points Sealed</span>
          </>
        ) : (
          <>
            <Trophy size={14} />
            <span>{(nominee.total_points ?? 0).toLocaleString()} pts</span>
          </>
        )}
      </div>
    </Link>
  );
}

function NomineeRow({ nominee, rank, isVotingClosed }) {
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
        {isVotingClosed ? (
          <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Lock size={12} /> Sealed
          </span>
        ) : (
          <>
            <Trophy size={13} />
            <span>{(nominee.total_points ?? 0).toLocaleString()}</span>
          </>
        )}
      </div>

      <ChevronRight size={16} className="nominee-row-chevron" />
    </Link>
  );
}

export default function TopNominees() {
  const { isVotingClosed } = useVotingStatus();
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Top Nominees & Leaderboard • DeKUTSO Comrade Choice Awards 2026';
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
          {/* Verification & Freedom Hall Ribbon */}
          <div className="category-ceremony-strip" style={{ marginBottom: '1.25rem' }}>
            <div className="category-ceremony-strip-left">
              <span className="ceremony-pulse-dot" />
              <ShieldCheck size={16} style={{ color: 'var(--color-primary, #1B5E20)' }} />
              <span>Vote Verification In Progress</span>
            </div>
            <div className="category-ceremony-strip-right">
              <MapPin size={15} style={{ color: 'var(--color-accent, #D4A017)' }} />
              <span>
                Award Ceremony: <strong>Freedom Hall</strong> &bull; <em>Dates yet to be communicated</em>
              </span>
            </div>
          </div>

          <div className="top-nominees-header-inner">
            <Award size={36} className="header-award-icon" />
            <div>
              <h1>Top Nominees &amp; Leaderboard</h1>
              <p className="top-nominees-subtitle">
                Voting has concluded &bull; Verification is actively ongoing &bull; Grand Ceremony at Freedom Hall
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

        {!loading && nominees.length === 0 && (
          <div className="empty-state ceremony-empty-verification-state">
            <div className="ceremony-empty-icon-wrap">
              <ShieldCheck size={42} style={{ color: 'var(--color-accent, #D4A017)' }} />
            </div>
            <h3>Vote Verification &amp; Ballot Audit In Progress</h3>
            <p style={{ maxWidth: '560px', margin: '0.75rem auto 1.5rem', lineHeight: 1.6 }}>
              All submitted votes and candidate standings across all 26 categories are currently being audited and verified by the DeKUTSO Committee. 
              The final certified winners will be crowned live at <strong>Freedom Hall</strong>.
            </p>
            <div className="ceremony-tag-group">
              <span className="ceremony-info-chip">
                <MapPin size={14} /> Freedom Hall (DeKUT)
              </span>
              <span className="ceremony-info-chip">
                <Calendar size={14} /> Dates Yet To Be Communicated
              </span>
            </div>
            <div style={{ marginTop: '1.75rem' }}>
              <Link to="/categories" className="btn btn-gold btn-sm">
                <Award size={14} /> Explore Award Categories
              </Link>
            </div>
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
                    <PodiumCard
                      key={nom.id}
                      nominee={nom}
                      rank={i}
                      isVotingClosed={isVotingClosed}
                    />
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
                    <NomineeRow
                      key={nom.id}
                      nominee={nom}
                      rank={i + 4}
                      isVotingClosed={isVotingClosed}
                    />
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
