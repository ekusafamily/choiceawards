import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import CategoryCard from '../components/CategoryCard';
import { FALLBACK_CATEGORIES } from '../utils/fallbackCategories';
import { MapPin, ShieldCheck } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    document.title = 'Award Categories • DeKUTSO Comrade Choice Awards 2026';
    async function fetch() {
      try {
        const { data } = await apiClient.get('/categories');
        if (data && Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }
      } catch (err) {
        console.error('Failed to load categories, using fallback:', err);
        setCategories(FALLBACK_CATEGORIES);
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
        {/* Verification & Freedom Hall Ribbon */}
        <div className="category-ceremony-strip">
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

        <div className="section-title">
          <h2>All Award Categories</h2>
          <hr className="gold-line" />
          <p>
            26 official categories recognizing individual student brilliance, campus leadership, and student organizations.
          </p>
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
