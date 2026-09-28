import { useState, useRef, useEffect, useMemo } from 'react';
import { Award, Search, ChevronDown, Check, X, Trophy } from 'lucide-react';

export default function CategorySelect({
  value = '',
  categories = [],
  onChange,
  name = 'category_id',
  id = 'category_id',
  placeholder = 'Select an award category...',
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Find currently selected category object
  const selectedCategory = useMemo(() => {
    if (!value) return null;
    return categories.find((c) => String(c.id) === String(value)) || null;
  }, [value, categories]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  function notifyChange(newVal) {
    if (!onChange) return;
    const event = {
      target: {
        name,
        value: newVal,
      },
    };
    onChange(event);
  }

  function handleSelect(catId) {
    notifyChange(catId);
    setIsOpen(false);
    setSearchQuery('');
    setActiveIndex(-1);
  }

  function handleClear(e) {
    e.stopPropagation();
    notifyChange('');
    setSearchQuery('');
    setActiveIndex(-1);
  }

  function handleToggleOpen() {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setSearchQuery('');
        setActiveIndex(-1);
      }
      return next;
    });
  }

  function handleKeyDown(e) {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredCategories.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredCategories.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredCategories.length) {
        handleSelect(filteredCategories[activeIndex].id);
      } else if (filteredCategories.length === 1) {
        handleSelect(filteredCategories[0].id);
      }
    }
  }

  return (
    <div
      className={`course-select-container custom-select-container ${isOpen ? 'is-open' : ''}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML5 required form validation */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute', pointerEvents: 'none' }}
          value={value}
          onChange={() => {}}
          required={required}
        />
      )}

      {/* Main trigger button */}
      <button
        type="button"
        id={id}
        className={`course-select-trigger custom-select-trigger ${value ? 'has-value' : ''}`}
        onClick={handleToggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="course-select-trigger-left">
          <Award size={18} className="course-trigger-icon category-trigger-icon" />
          <span className={`course-select-label ${!selectedCategory ? 'is-placeholder' : ''}`}>
            {selectedCategory ? selectedCategory.name : placeholder}
          </span>
        </span>

        <span className="course-select-trigger-right">
          {value && (
            <span
              role="button"
              tabIndex={0}
              className="course-clear-btn"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleClear(e);
              }}
              title="Clear category"
              aria-label="Clear category"
            >
              <X size={15} />
            </span>
          )}
          <ChevronDown size={18} className={`course-chevron ${isOpen ? 'rotate' : ''}`} />
        </span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="course-dropdown-menu custom-dropdown-menu" role="listbox">
          {/* Sticky Search bar */}
          <div className="course-search-header">
            <div className="course-search-box">
              <Search size={16} className="course-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="course-search-input"
                placeholder="Search award category (e.g. Leader, Sports, Tech)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveIndex(-1);
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="course-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="course-search-meta">
              <span className="course-count-badge">
                {filteredCategories.length}{' '}
                {filteredCategories.length === 1 ? 'category' : 'categories'} available
              </span>
            </div>
          </div>

          {/* Scrollable list of categories */}
          <div className="course-options-list" ref={listRef}>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat, idx) => {
                const isSelected = String(value) === String(cat.id);
                const isActive = activeIndex === idx;

                return (
                  <div
                    key={cat.id}
                    role="option"
                    aria-selected={isSelected}
                    className={`course-option-item ${isSelected ? 'selected' : ''} ${
                      isActive ? 'active' : ''
                    }`}
                    onClick={() => handleSelect(cat.id)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span className="course-item-bullet category-bullet" />
                    <span className="course-item-name">{cat.name}</span>
                    {isSelected && <Check size={16} className="course-check-icon" />}
                  </div>
                );
              })
            ) : (
              <div className="course-no-results">
                <p className="no-result-text">
                  No matching categories found for "<strong>{searchQuery}</strong>"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
