import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import CategoryCard from '../components/CategoryCard';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const filtered =
    filter === 'all'
      ? categories
      : categories.filter((c) => c.type === filter);

  return (
    <div className="page">
      <div className="container">
        <div className="section-title">
          <h2>All Award Categories</h2>
          <hr className="gold-line" />
          <p>Choose a category to view nominees and leaderboards.</p>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-xl)',
          }}
        >
          {['all', 'individual', 'organization'].map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(f)}
              style={{ textTransform: 'capitalize' }}
            >
              {f === 'all' ? 'All Categories' : `${f} Awards`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="categories-grid">
            {filtered.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No categories found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
