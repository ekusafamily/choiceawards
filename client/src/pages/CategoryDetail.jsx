import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import apiClient from '../api/client';
import NomineeCard from '../components/NomineeCard';
import LeaderboardTable from '../components/LeaderboardTable';

export default function CategoryDetail() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('leaderboard');

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
            <Link to="/categories" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>
              Back to Categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Add position numbers
  const rankedNominees = nominees.map((n, i) => ({ ...n, position: i + 1 }));

  return (
    <div className="page">
      <div className="container">
        <Link
          to="/categories"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            marginBottom: 'var(--space-lg)',
            color: 'var(--color-text-muted)',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Categories
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
          />
        ) : (
          nominees.length > 0 ? (
            <div className="nominees-grid">
              {nominees.map((n) => (
                <NomineeCard key={n.id} nominee={n} />
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
    </div>
  );
}
