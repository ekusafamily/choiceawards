import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Lock, MapPin, ShieldCheck, Calendar, Trophy, Award } from 'lucide-react';
import apiClient from '../api/client';
import NomineeCard from '../components/NomineeCard';
import LeaderboardTable from '../components/LeaderboardTable';
import VoteModal from '../components/VoteModal';
import { useVotingStatus } from '../utils/votingDeadline';
import { FALLBACK_CATEGORIES } from '../utils/fallbackCategories';

export default function CategoryDetail() {
  const { slug } = useParams();
  const { isVotingClosed } = useVotingStatus();
  const fallbackMatch = FALLBACK_CATEGORIES.find((c) => c.slug === slug);
  const [category, setCategory] = useState(fallbackMatch || null);
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('leaderboard');
  const [votingFor, setVotingFor] = useState(null);
  const [voteSuccess, setVoteSuccess] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await apiClient.get(`/categories/${slug}`);
        if (data) {
          setCategory(data);
          if (data.name) {
            document.title = `${data.name} • DeKUTSO Comrade Choice Awards 2026`;
          }
          setNominees(data.nominees || []);
        } else if (fallbackMatch) {
          setCategory(fallbackMatch);
          document.title = `${fallbackMatch.name} • DeKUTSO Comrade Choice Awards 2026`;
        }
      } catch (err) {
        console.error('Failed to load category, using fallback:', err);
        if (fallbackMatch) {
          setCategory(fallbackMatch);
          document.title = `${fallbackMatch.name} • DeKUTSO Comrade Choice Awards 2026`;
        }
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [slug]);

  function handleVoteSuccess(voteResult) {
    setNominees((prev) =>
      prev
        .map((n) =>
          n.id === voteResult.nominee_id
            ? { ...n, total_points: (n.total_points || 0) + (voteResult.points || 0) }
            : n
        )
        .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
    );
    setVoteSuccess(true);
    setTimeout(() => setVoteSuccess(false), 5000);
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="page">
        <div className="container">
          <div className="error-state">
            <h2>Category Not Found</h2>
            <p>The category you are looking for does not exist.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Add position numbers (already sorted by points from backend)
  const rankedNominees = nominees.map((n, i) => ({ ...n, position: i + 1 }));

  return (
    <div className="page">
      <div className="container">
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            marginBottom: 'var(--space-lg)',
            color: 'var(--color-text-muted)',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

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

        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: 'var(--color-accent-dim)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-accent)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: 'var(--space-sm)',
            }}
          >
            {category.type} Award
          </span>
          <h1 style={{ fontSize: '2rem' }}>{category.name}</h1>
        </div>

        {/* Vote success toast */}
        {voteSuccess && (
          <div
            style={{
              padding: 'var(--space-md)',
              background: 'rgba(27, 94, 32, 0.1)',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-lg)',
              color: 'var(--color-success)',
              fontWeight: 600,
            }}
          >
            ✓ Vote submitted! Thank you for your support.
          </div>
        )}

        {isVotingClosed && (
          <div
            style={{
              padding: 'var(--space-md) var(--space-lg)',
              background: 'rgba(212, 160, 23, 0.1)',
              border: '1px solid var(--color-gold)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-xl)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <ShieldCheck size={20} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--color-gold)', display: 'block' }}>
                Vote Verification Ongoing &bull; Gala Ceremony at Freedom Hall
              </strong>
              <span style={{ fontSize: '0.88rem', opacity: 0.85 }}>
                Voting for <strong>{category.name}</strong> has concluded. Votes are undergoing official verification by the DeKUTSO Committee. 
                Winners will be presented live at <strong>Freedom Hall</strong> (dates yet to be communicated).
              </span>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-xl)',
          }}
        >
          <button
            className={`btn btn-sm ${view === 'leaderboard' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('leaderboard')}
          >
            Leaderboard
          </button>
          <button
            className={`btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('grid')}
          >
            Grid View
          </button>
        </div>

        {view === 'leaderboard' ? (
          <LeaderboardTable
            nominees={rankedNominees}
            categoryName={category.name}
            onVote={isVotingClosed ? null : (nominee) => setVotingFor(nominee)}
          />
        ) : (
          nominees.length > 0 ? (
            <div className="nominees-grid">
              {rankedNominees.map((n) => (
                <NomineeCard
                  key={n.id}
                  nominee={n}
                  onVote={isVotingClosed ? null : (nominee) => setVotingFor(nominee)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No approved nominees in this category yet.</p>
              <Link to="/nominate" className="btn btn-gold" style={{ marginTop: 'var(--space-lg)' }}>
                Nominate Someone
              </Link>
            </div>
          )
        )}
      </div>

      {/* Vote Modal */}
      {votingFor && (
        <VoteModal
          nominee={votingFor}
          onClose={() => setVotingFor(null)}
          onSuccess={handleVoteSuccess}
        />
      )}
    </div>
  );
}

