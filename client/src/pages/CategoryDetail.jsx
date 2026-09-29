import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import apiClient from '../api/client';
import NomineeCard from '../components/NomineeCard';
import LeaderboardTable from '../components/LeaderboardTable';
import VoteModal from '../components/VoteModal';

export default function CategoryDetail() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('leaderboard');
  const [votingFor, setVotingFor] = useState(null);
  const [voteSuccess, setVoteSuccess] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await apiClient.get(`/categories/${slug}`);
        setCategory(data);
        setNominees(data.nominees || []);
      } catch (err) {
        console.error('Failed to load category:', err);
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
            onVote={(nominee) => setVotingFor(nominee)}
          />
        ) : (
          nominees.length > 0 ? (
            <div className="nominees-grid">
              {nominees.map((n) => (
                <NomineeCard
                  key={n.id}
                  nominee={n}
                  onVote={(nominee) => setVotingFor(nominee)}
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

