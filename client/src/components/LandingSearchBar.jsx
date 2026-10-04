import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, X, User, Award, Trophy, ChevronRight,
  Sparkles, Shield, Users, Star, Palette, Code,
  Camera, Megaphone, ArrowUpRight, Clock, Music
} from 'lucide-react';

const CATEGORY_ICON_MAP = {
  'tech-developer': Code,
  'male-student-leader': Shield,
  'female-student-leader': Shield,
  'best-sports-captain': Trophy,
  'student-artist': Palette,
  'music-artist-of-the-year': Music,
  'music-artist': Music,
  'photographer-videographer': Camera,
  'association-club-leader': Megaphone,
  'male-sports-person': Trophy,
  'female-sports-person': Trophy,
  'male-influencer': Star,
  'female-influencer': Star,
};

const POPULAR_SEARCHES = [
  'Tech Developer',
  'Male Student Leader',
  'Female Student Leader',
  'Music Artist',
  'Sports Captain',
  'Student Artist',
  'Brian',
];

export default function LandingSearchBar({
  categories = [],
  nominees = [],
  nomineeCountMap = {},
  onVote,
  searchQuery = '',
  onSearchChange,
}) {
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'nominees' | 'categories'
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Sync internal state if parent changes searchQuery
  useEffect(() => {
    setInternalQuery(searchQuery);
  }, [searchQuery]);

  const query = internalQuery.trim().toLowerCase();

  // Filter Nominees
  const matchingNominees = useMemo(() => {
    if (!query) return [];
    return nominees.filter((n) => {
      const name = (n.name || '').toLowerCase();
      const course = (n.course || '').toLowerCase();
      const catName = (n.categories?.name || '').toLowerCase();
      const bio = (n.bio || '').toLowerCase();
      return (
        name.includes(query) ||
        course.includes(query) ||
        catName.includes(query) ||
        bio.includes(query)
      );
    });
  }, [nominees, query]);

  // Filter Categories
  const matchingCategories = useMemo(() => {
    if (!query) return [];
    return categories.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const slug = (c.slug || '').toLowerCase();
      return name.includes(query) || desc.includes(query) || slug.includes(query);
    });
  }, [categories, query]);

  const totalResults = matchingNominees.length + matchingCategories.length;

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    const val = e.target.value;
    setInternalQuery(val);
    setIsOpen(true);
    if (onSearchChange) {
      onSearchChange(val);
    }
  }

  function handleClear() {
    setInternalQuery('');
    setIsOpen(false);
    if (onSearchChange) {
      onSearchChange('');
    }
    inputRef.current?.focus();
  }

  function handleTagClick(tag) {
    setInternalQuery(tag);
    setIsOpen(true);
    if (onSearchChange) {
      onSearchChange(tag);
    }
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      // If there's an exact or first match, navigate or blur
      if (matchingNominees.length > 0) {
        navigate(`/nominees/${matchingNominees[0].id}`);
        setIsOpen(false);
      } else if (matchingCategories.length > 0) {
        navigate(`/categories/${matchingCategories[0].slug}`);
        setIsOpen(false);
      }
    }
  }

  const showNominees = (activeFilter === 'all' || activeFilter === 'nominees') && matchingNominees.length > 0;
  const showCategories = (activeFilter === 'all' || activeFilter === 'categories') && matchingCategories.length > 0;

  return (
    <div className="landing-search-wrapper" ref={containerRef}>
      <div className="landing-search-container">
        {/* Search Bar Input Box */}
        <div className={`landing-search-input-box ${isOpen && query ? 'focused' : ''}`}>
          <Search size={22} className="landing-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className="landing-search-input"
            value={internalQuery}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search nominees or categories (e.g. Brian, Tech Developer, Sports)..."
            aria-label="Search nominees and categories"
            id="landing-search-input"
            autoComplete="off"
          />

          {internalQuery && (
            <button
              type="button"
              className="landing-search-clear-btn"
              onClick={handleClear}
              aria-label="Clear search query"
              id="landing-search-clear-btn"
            >
              <X size={18} />
            </button>
          )}

          <div className="landing-search-badge">
            <Sparkles size={14} color="var(--color-accent)" />
            <span>Instant Search</span>
          </div>
        </div>

        {/* Popular Tags / Filter Pills */}
        <div className="landing-search-tags-row">
          <span className="landing-search-tags-label">Popular:</span>
          <div className="landing-search-tags-list">
            {POPULAR_SEARCHES.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`landing-search-tag-chip ${internalQuery.toLowerCase() === tag.toLowerCase() ? 'active' : ''}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Live Search Autocomplete Dropdown */}
        {isOpen && query && (
          <div className="landing-search-dropdown" id="landing-search-dropdown">
            {/* Filter Tabs Header */}
            <div className="landing-search-tabs">
              <button
                type="button"
                className={`landing-search-tab ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All Results ({totalResults})
              </button>
              <button
                type="button"
                className={`landing-search-tab ${activeFilter === 'nominees' ? 'active' : ''}`}
                onClick={() => setActiveFilter('nominees')}
              >
                Nominees ({matchingNominees.length})
              </button>
              <button
                type="button"
                className={`landing-search-tab ${activeFilter === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveFilter('categories')}
              >
                Categories ({matchingCategories.length})
              </button>
            </div>

            {/* Results Body */}
            <div className="landing-search-results-scroll">
              {totalResults === 0 ? (
                <div className="landing-search-empty">
                  <p>No nominees or categories found matching &ldquo;<strong>{internalQuery}</strong>&rdquo;</p>
                  <span>Try searching by candidate name, course, or award category.</span>
                </div>
              ) : (
                <>
                  {/* Nominees Results Group */}
                  {showNominees && (
                    <div className="landing-search-group">
                      <div className="landing-search-group-header">
                        <User size={15} />
                        <span>Nominees ({matchingNominees.length})</span>
                      </div>
                      <div className="landing-search-items-list">
                        {matchingNominees.slice(0, 6).map((nom) => (
                          <div
                            key={nom.id}
                            className="landing-search-item nominee-item"
                          >
                            <Link
                              to={`/nominees/${nom.id}`}
                              className="landing-search-item-main"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="landing-search-avatar">
                                {nom.photo_url ? (
                                  <img src={nom.photo_url} alt={nom.name} className="landing-search-avatar-img" />
                                ) : (
                                  <div className="landing-search-avatar-placeholder">
                                    <User size={18} />
                                  </div>
                                )}
                              </div>
                              <div className="landing-search-item-info">
                                <div className="landing-search-item-title-row">
                                  <span className="landing-search-item-name">{nom.name}</span>
                                  {nom.categories?.name && (
                                    <span className="landing-search-cat-badge">{nom.categories.name}</span>
                                  )}
                                </div>
                                <div className="landing-search-item-sub">
                                  <span>{nom.course || 'DeKUT Student'}</span>
                                  {/* Points tally hidden until voting commences */}
                                  {/* {nom.total_points !== undefined && (
                                    <span className="landing-search-points">
                                      <Trophy size={12} color="var(--color-accent)" />
                                      {(nom.total_points || 0).toLocaleString()} pts
                                    </span>
                                  )} */}
                                </div>
                              </div>
                            </Link>

                            <div className="landing-search-item-actions">
                              {/* Vote button commented out for nomination period */}
                              {/* {onVote && (
                                <button
                                  type="button"
                                  className="btn btn-gold btn-sm landing-search-vote-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    onVote(nom);
                                  }}
                                  title={`Vote for ${nom.name}`}
                                >
                                  <Trophy size={13} /> Vote
                                </button>
                              )} */}
                              <span className="landing-search-soon-badge">
                                <Clock size={11} style={{ marginRight: 4 }} />
                                Voting Commencing Soon
                              </span>
                              <Link
                                to={`/nominees/${nom.id}`}
                                className="landing-search-view-link"
                                onClick={() => setIsOpen(false)}
                                title="View Nominee Profile"
                              >
                                <ChevronRight size={18} />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories Results Group */}
                  {showCategories && (
                    <div className="landing-search-group">
                      <div className="landing-search-group-header">
                        <Award size={15} />
                        <span>Award Categories ({matchingCategories.length})</span>
                      </div>
                      <div className="landing-search-items-list">
                        {matchingCategories.slice(0, 6).map((cat) => {
                          const IconComp = CATEGORY_ICON_MAP[cat.slug] || Award;
                          const count = nomineeCountMap[cat.id] || 0;
                          return (
                            <Link
                              key={cat.id}
                              to={`/categories/${cat.slug}`}
                              className="landing-search-item category-item"
                              onClick={() => setIsOpen(false)}
                            >
                              <div className="landing-search-cat-icon">
                                <IconComp size={18} />
                              </div>
                              <div className="landing-search-item-info">
                                <span className="landing-search-item-name">{cat.name}</span>
                                <span className="landing-search-item-sub">
                                  {cat.type === 'organization' ? 'Organization Award' : 'Individual Award'} &bull; {count} {count === 1 ? 'nominee' : 'nominees'}
                                </span>
                              </div>
                              <ArrowUpRight size={16} className="landing-search-arrow" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Dropdown Footer */}
            {totalResults > 0 && (
              <div className="landing-search-dropdown-footer">
                <span>Showing top matches &bull; Press <kbd>ESC</kbd> to close</span>
                <Link
                  to="/nominees"
                  className="landing-search-all-link"
                  onClick={() => setIsOpen(false)}
                >
                  View All Nominees Leaderboard &rarr;
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
