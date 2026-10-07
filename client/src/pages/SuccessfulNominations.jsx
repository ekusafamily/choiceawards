import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, CheckCircle2, User, Clock,
  X
} from 'lucide-react';
import apiClient from '../api/client';

function WhatsAppIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.44 19.65L5.27 16.61L5.07 16.29C4.24 14.97 3.81 13.46 3.81 11.91C3.81 7.37 7.5 3.68 12.05 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.27 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.57 14.33C16.32 14.21 15.1 13.61 14.88 13.52C14.65 13.44 14.49 13.4 14.32 13.65C14.16 13.89 13.69 14.45 13.55 14.61C13.41 14.77 13.26 14.79 13.02 14.67C12.77 14.55 11.98 14.29 11.04 13.45C10.31 12.8 9.81 11.99 9.67 11.75C9.53 11.51 9.65 11.37 9.77 11.25C9.88 11.14 10.02 10.96 10.14 10.82C10.26 10.68 10.3 10.57 10.38 10.41C10.46 10.25 10.42 10.11 10.36 9.99C10.3 9.86 9.81 8.67 9.61 8.18C9.41 7.7 9.21 7.77 9.06 7.76L8.59 7.75C8.42 7.75 8.16 7.81 7.93 8.06C7.71 8.3 7.07 8.9 7.07 10.12C7.07 11.34 7.96 12.52 8.08 12.68C8.21 12.84 9.82 15.33 12.29 16.39C12.88 16.64 13.34 16.8 13.69 16.91C14.28 17.1 14.82 17.07 15.25 17.01C15.73 16.94 16.72 16.41 16.92 15.84C17.13 15.27 17.13 14.79 17.07 14.68C17.01 14.58 16.82 14.46 16.57 14.33Z" />
    </svg>
  );
}

export default function SuccessfulNominations() {
  const [nominees, setNominees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    document.title = 'Successful Nominations • DeKUTSO Comrade Choice Awards 2026';
    async function loadData() {
      try {
        const [nomsRes, catsRes] = await Promise.all([
          apiClient.get('/nominees').catch(() => ({ data: [] })),
          apiClient.get('/categories').catch(() => ({ data: [] })),
        ]);
        setNominees(nomsRes.data || []);
        setCategories(catsRes.data || []);
      } catch (err) {
        console.error('Failed to load successful nominations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered nominees
  const filteredNominees = useMemo(() => {
    return nominees.filter((n) => {
      const matchesCat =
        selectedCategory === 'all' ||
        String(n.category_id) === String(selectedCategory) ||
        n.categories?.slug === selectedCategory;

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (n.name || '').toLowerCase().includes(q) ||
        (n.course || '').toLowerCase().includes(q) ||
        (n.categories?.name || '').toLowerCase().includes(q);

      return matchesCat && matchesSearch;
    });
  }, [nominees, selectedCategory, search]);

  function handleShareNominee(e, nom) {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/nominees/${nom.id}`
      : `https://demo.balktraders.site/nominees/${nom.id}`;
    const text = `Check out ${nom.name}'s successful nomination for the DeKUTSO Comrade Choice Awards 2026!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="page successful-noms-page">
      <div className="container">
        {/* Header */}
        <div className="section-title">
          <div className="successful-noms-pill">
            <CheckCircle2 size={15} />
            <span>Vetted & Approved</span>
          </div>
          <h2>Successful Nominations</h2>
          <hr className="gold-line" />
          <p>
            Official directory of candidates whose nominations have been reviewed and approved by the DeKUTSO Awards Committee. Voting will commence soon!
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="successful-noms-controls">
          <div className="successful-noms-search-wrap">
            <Search size={18} className="successful-noms-search-icon" />
            <input
              type="text"
              className="form-control successful-noms-search-input"
              placeholder="Search by candidate name, course, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="successful-noms-clear-btn"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="successful-noms-select-wrap">
            <select
              className="form-control successful-noms-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All Categories ({nominees.length})</option>
              {categories.map((c) => {
                const count = nominees.filter((n) => n.category_id === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Status Callout Banner */}
        <div className="successful-noms-status-callout">
          <div className="status-callout-left">
            <Clock size={20} className="status-callout-icon" />
            <div>
              <strong>Nominations Period Active</strong>
              <p>All approved candidates are published below. Official voting lines will open shortly.</p>
            </div>
          </div>
          <Link to="/nominate" className="btn btn-gold btn-sm status-callout-cta">
            Nominate Another Comrade
          </Link>
        </div>

        {/* Content Grid / Loading / Empty */}
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : filteredNominees.length > 0 ? (
          <div className="nominees-grid">
            {filteredNominees.map((nom) => (
              <div key={nom.id} className="nominee-card successful-nom-card">
                <Link to={`/nominees/${nom.id}`} className="nominee-card-link">
                  {nom.photo_url ? (
                    <img
                      src={nom.photo_url}
                      alt={nom.name}
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
                    {nom.categories?.name && (
                      <span className="successful-nom-cat-badge">
                        {nom.categories.name}
                      </span>
                    )}
                    <h4>{nom.name}</h4>
                    <p className="nominee-course">
                      {nom.course || 'Course not specified'}
                      {nom.year_of_study ? ` • ${nom.year_of_study.replace(/^year\s*/i, 'Year ')}` : ''}
                    </p>
                  </div>
                </Link>

                <div className="nominee-card-vote successful-nom-actions">
                  <div className="voting-soon-badge">
                    <Clock size={12} />
                    <span>Voting Commencing Soon</span>
                  </div>
                  <div className="successful-nom-action-row">
                    <button
                      type="button"
                      className="share-btn share-btn-whatsapp successful-nom-whatsapp-btn"
                      onClick={(e) => handleShareNominee(e, nom)}
                      title="Share nomination on WhatsApp"
                      aria-label="Share nomination on WhatsApp"
                    >
                      <WhatsAppIcon size={15} className="whatsapp-icon" />
                      <span>WhatsApp</span>
                    </button>
                    <Link
                      to={`/nominees/${nom.id}`}
                      className="successful-nom-profile-btn"
                      title="View Full Profile"
                    >
                      Profile &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>
              {search || selectedCategory !== 'all'
                ? 'No approved nominations found matching your filters.'
                : 'No approved nominations published yet. Nominations are currently under committee review.'}
            </p>
            <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center', flexWrap: 'wrap' }}>
              {(search || selectedCategory !== 'all') && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('all');
                  }}
                >
                  Reset Filters
                </button>
              )}
              <Link to="/nominate" className="btn btn-gold btn-sm">
                Nominate a Comrade Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
