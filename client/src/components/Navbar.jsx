import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, X, Menu, User, Award, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const navRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // Lazy load categories and nominees on first search open
  useEffect(() => {
    if (searchOpen && categories.length === 0 && !loadingData) {
      setLoadingData(true);
      Promise.all([
        apiClient.get('/categories').catch(() => ({ data: [] })),
        apiClient.get('/nominees').catch(() => ({ data: [] })),
      ]).then(([catRes, nomRes]) => {
        setCategories(catRes.data || []);
        setNominees(nomRes.data || []);
      }).finally(() => {
        setLoadingData(false);
      });
    }
  }, [searchOpen, categories.length, loadingData]);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  // Click outside to close search
  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleToggleSearch() {
    setSearchOpen((prev) => !prev);
    if (!searchOpen) {
      setOpen(false); // Close menu if search is opened
    }
  }

  function handleToggleMenu() {
    setOpen((prev) => !prev);
    if (!open) {
      setSearchOpen(false); // Close search if menu is opened
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    } else if (e.key === 'Enter') {
      if (matchedNominees.length > 0) {
        navigate(`/nominees/${matchedNominees[0].id}`);
        setSearchOpen(false);
        setQuery('');
      } else if (matchedCategories.length > 0) {
        navigate(`/categories/${matchedCategories[0].slug}`);
        setSearchOpen(false);
        setQuery('');
      }
    }
  }

  const trimmedQuery = query.trim().toLowerCase();

  const matchedNominees = trimmedQuery
    ? nominees.filter((n) => {
        const name = (n.name || '').toLowerCase();
        const course = (n.course || '').toLowerCase();
        const catName = (n.categories?.name || '').toLowerCase();
        return (
          name.includes(trimmedQuery) ||
          course.includes(trimmedQuery) ||
          catName.includes(trimmedQuery)
        );
      }).slice(0, 5)
    : [];

  const matchedCategories = trimmedQuery
    ? categories.filter((c) => {
        const name = (c.name || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const slug = (c.slug || '').toLowerCase();
        return (
          name.includes(trimmedQuery) ||
          desc.includes(trimmedQuery) ||
          slug.includes(trimmedQuery)
        );
      }).slice(0, 4)
    : [];

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation" ref={navRef}>
      <div className="navbar-inner">
        <Link
          to="/"
          className="navbar-brand"
          id="navbar-brand"
          onClick={() => {
            setOpen(false);
            setSearchOpen(false);
          }}
        >
          <img src="/dekutso-logo.png" alt="DeKUTSO Logo" className="navbar-brand-logo" />
          <span className="navbar-brand-text">DeKUTSO Comrade Choice Award</span>
        </Link>

        {/* Action Buttons: Search Toggle + Hamburger Menu */}
        <div className="navbar-actions">
          <button
            type="button"
            className={`navbar-action-btn navbar-search-toggle ${searchOpen ? 'active' : ''}`}
            onClick={handleToggleSearch}
            aria-label={searchOpen ? 'Close search' : 'Search nominees and categories'}
            aria-expanded={searchOpen}
            id="navbar-search-toggle"
            title="Search Nominees & Categories"
          >
            {searchOpen ? <X size={22} /> : <Search size={22} />}
          </button>

          <button
            type="button"
            className="navbar-toggle"
            onClick={handleToggleMenu}
            aria-label="Toggle navigation"
            aria-expanded={open}
            id="navbar-toggle"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <ul className={`navbar-links ${open ? 'open' : ''}`} id="navbar-links">
          <li>
            <NavLink
              to="/"
              end
              onClick={() => {
                setOpen(false);
                setSearchOpen(false);
              }}
              id="navbar-home-link"
            >
              Home
            </NavLink>
          </li>
          {/* Nominees link hidden during nomination phase */}
          {/* <li>
            <NavLink
              to="/nominees"
              onClick={() => {
                setOpen(false);
                setSearchOpen(false);
              }}
              id="navbar-nominees-link"
            >
              Nominees
            </NavLink>
          </li> */}
          <li>
            <NavLink
              to="/successful-nominations"
              onClick={() => {
                setOpen(false);
                setSearchOpen(false);
              }}
              id="navbar-successful-nominations-link"
            >
              Successful Nominations
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/nominate"
              className="navbar-cta"
              onClick={() => {
                setOpen(false);
                setSearchOpen(false);
              }}
              id="navbar-nominate-btn"
            >
              Nominate
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Expanding Search Bar (Smoothly slides down right below navbar on mobile & desktop) */}
      {searchOpen && (
        <div className="navbar-search-expand-bar" id="navbar-search-expand-bar">
          <div className="navbar-search-expand-inner">
            <div className="navbar-search-input-box">
              <Search size={18} className="navbar-search-box-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="navbar-search-box-input"
                placeholder="Search nominees or categories (e.g. Brian, Tech)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Search nominees and categories"
                id="navbar-search-input"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="navbar-search-box-clear"
                  onClick={() => {
                    setQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search text"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown List */}
            {trimmedQuery && (
              <div className="navbar-search-dropdown-menu">
                {matchedNominees.length === 0 && matchedCategories.length === 0 ? (
                  <div className="navbar-search-no-results">
                    No matching nominees or categories found for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  <div className="navbar-search-results-list">
                    {/* Nominees Matches */}
                    {matchedNominees.length > 0 && (
                      <div className="navbar-search-section">
                        <div className="navbar-search-section-title">
                          <User size={13} />
                          <span>Nominees ({matchedNominees.length})</span>
                        </div>
                        {matchedNominees.map((nom) => (
                          <Link
                            key={nom.id}
                            to={`/nominees/${nom.id}`}
                            className="navbar-search-result-item"
                            onClick={() => {
                              setSearchOpen(false);
                              setQuery('');
                            }}
                          >
                            <div className="navbar-search-result-avatar">
                              {nom.photo_url ? (
                                <img src={nom.photo_url} alt={nom.name} />
                              ) : (
                                <User size={14} />
                              )}
                            </div>
                            <div className="navbar-search-result-info">
                              <span className="navbar-search-result-name">{nom.name}</span>
                              <span className="navbar-search-result-sub">
                                {nom.categories?.name || nom.course || 'DeKUT Student'}
                              </span>
                            </div>
                            <ChevronRight size={16} className="navbar-search-result-chevron" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Categories Matches */}
                    {matchedCategories.length > 0 && (
                      <div className="navbar-search-section">
                        <div className="navbar-search-section-title">
                          <Award size={13} />
                          <span>Categories ({matchedCategories.length})</span>
                        </div>
                        {matchedCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/categories/${cat.slug}`}
                            className="navbar-search-result-item"
                            onClick={() => {
                              setSearchOpen(false);
                              setQuery('');
                            }}
                          >
                            <div className="navbar-search-result-cat-icon">
                              <Award size={14} />
                            </div>
                            <div className="navbar-search-result-info">
                              <span className="navbar-search-result-name">{cat.name}</span>
                              <span className="navbar-search-result-sub">
                                {cat.type === 'organization' ? 'Organization Award' : 'Individual Award'}
                              </span>
                            </div>
                            <ChevronRight size={16} className="navbar-search-result-chevron" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
