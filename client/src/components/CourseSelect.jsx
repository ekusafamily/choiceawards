import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, GraduationCap, PlusCircle } from 'lucide-react';

export const DEKUT_COURSES = [
  'Bachelor of Business Administration',
  'Bachelor of Commerce',
  'Bachelor of Education Technology in Civil Engineering',
  'Bachelor of Education Technology in Electrical & Electronic Engineering',
  'Bachelor of Education Technology in Mechanical Engineering',
  'Bachelor of Purchasing and Supplies Management',
  'Bachelor of Sustainable Tourism & Hospitality Management',
  'Bachelor of Technology in Building Construction',
  'BSc. in Actuarial Science',
  'BSc. in Business Information Technology',
  'BSc. in Chemical Engineering',
  'BSc. in Civil Engineering',
  'BSc. in Computer Science',
  'BSc. in Computer Security and Forensics',
  'BSc. in Criminology & Security Management',
  'BSc. in Data Science and Analytics',
  'BSc. in Electrical & Electronic Engineering',
  'BSc. in Food Science & Technology',
  'BSc. in Geology',
  'BSc. in Geomatics Engineering & Geospatial Information Systems',
  'BSc. in Geospatial Information Science & Remote Sensing',
  'BSc. in Industrial Chemistry',
  'BSc. in Information Technology',
  'BSc. in Leather Technology',
  'BSc. in Mathematics and Modeling Process',
  'BSc. in Mechanical Engineering',
  'BSc. in Mechatronic Engineering',
  'BSc. in Nursing (Direct entry)',
  'BSc. in Nursing (Upgrading)',
  'BSc. in Nutrition & Dietetics',
  'BSc. in Polymer Chemistry',
  'BSc. in Telecommunication Information Engineering',
];

export default function CourseSelect({
  value = '',
  onChange,
  name = 'course',
  id = 'course',
  placeholder = 'Select or search course / programme...',
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const customInputRef = useRef(null);

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return DEKUT_COURSES;
    return DEKUT_COURSES.filter((c) => c.toLowerCase().includes(q));
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsCustomMode(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input or custom input when opened
  useEffect(() => {
    if (isOpen && !isCustomMode) {
      // slight timeout to ensure element rendered
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (isOpen && isCustomMode) {
      const timer = setTimeout(() => {
        customInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isCustomMode]);

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
    // Deliver as both synthetic event (for standard form handlers) or raw value
    const event = {
      target: {
        name,
        value: newVal,
      },
    };
    onChange(event);
  }

  function handleSelect(course) {
    notifyChange(course);
    setIsOpen(false);
    setSearchQuery('');
    setActiveIndex(-1);
    setIsCustomMode(false);
  }

  function handleClear(e) {
    e.stopPropagation();
    notifyChange('');
    setSearchQuery('');
    setActiveIndex(-1);
    setIsCustomMode(false);
  }

  function handleToggleOpen() {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setSearchQuery('');
        setActiveIndex(-1);
        setIsCustomMode(false);
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
      setIsCustomMode(false);
      return;
    }

    if (isCustomMode) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredCourses.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredCourses.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filteredCourses.length) {
        handleSelect(filteredCourses[activeIndex]);
      } else if (filteredCourses.length === 1) {
        handleSelect(filteredCourses[0]);
      } else if (searchQuery.trim()) {
        handleSelect(searchQuery.trim());
      }
    }
  }

  function handleCustomSubmit(e) {
    e.preventDefault();
    if (customValue.trim()) {
      handleSelect(customValue.trim());
      setCustomValue('');
    }
  }

  return (
    <div
      className={`course-select-container ${isOpen ? 'is-open' : ''}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML5 form validation if needed */}
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
        className={`course-select-trigger ${value ? 'has-value' : ''}`}
        onClick={handleToggleOpen}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="course-select-trigger-left">
          <GraduationCap size={18} className="course-trigger-icon" />
          <span className={`course-select-label ${!value ? 'is-placeholder' : ''}`}>
            {value || placeholder}
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
              title="Clear selection"
              aria-label="Clear course"
            >
              <X size={15} />
            </span>
          )}
          <ChevronDown size={18} className={`course-chevron ${isOpen ? 'rotate' : ''}`} />
        </span>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="course-dropdown-menu" role="listbox">
          {!isCustomMode ? (
            <>
              {/* Sticky Search bar at top */}
              <div className="course-search-header">
                <div className="course-search-box">
                  <Search size={16} className="course-search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="course-search-input"
                    placeholder="Search courses (e.g. Computer Science, Civil)..."
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
                    {filteredCourses.length}{' '}
                    {filteredCourses.length === 1 ? 'course' : 'courses'} available
                  </span>
                  <button
                    type="button"
                    className="course-other-link"
                    onClick={() => {
                      setIsCustomMode(true);
                      setCustomValue(searchQuery);
                    }}
                  >
                    Not listed? Enter custom
                  </button>
                </div>
              </div>

              {/* Scrollable list of courses */}
              <div className="course-options-list" ref={listRef}>
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course, idx) => {
                    const isSelected = value === course;
                    const isActive = activeIndex === idx;

                    return (
                      <div
                        key={course}
                        role="option"
                        aria-selected={isSelected}
                        className={`course-option-item ${isSelected ? 'selected' : ''} ${
                          isActive ? 'active' : ''
                        }`}
                        onClick={() => handleSelect(course)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <span className="course-item-bullet" />
                        <span className="course-item-name">{course}</span>
                        {isSelected && <Check size={16} className="course-check-icon" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="course-no-results">
                    <p className="no-result-text">
                      No matching courses found for "<strong>{searchQuery}</strong>"
                    </p>
                    <button
                      type="button"
                      className="btn-use-custom"
                      onClick={() => handleSelect(searchQuery.trim())}
                    >
                      <PlusCircle size={15} /> Use "<strong>{searchQuery.trim()}</strong>" as course
                    </button>
                  </div>
                )}
              </div>

              {/* Quick footer to type custom if not found */}
              <div className="course-dropdown-footer">
                <button
                  type="button"
                  className="course-custom-entry-btn"
                  onClick={() => {
                    setIsCustomMode(true);
                    setCustomValue(searchQuery);
                  }}
                >
                  <PlusCircle size={15} /> Other / Custom Programme (Type manually)
                </button>
              </div>
            </>
          ) : (
            /* Custom entry mode */
            <div className="course-custom-form">
              <div className="course-custom-header">
                <strong>Enter Custom Course / Programme</strong>
                <p>If the nominee's course isn't in the list above, enter it here.</p>
              </div>
              <div className="course-custom-input-row">
                <input
                  ref={customInputRef}
                  type="text"
                  className="form-control"
                  placeholder="e.g. Master of Science in Computer Systems"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCustomSubmit(e);
                    }
                  }}
                />
              </div>
              <div className="course-custom-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCustomMode(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!customValue.trim()}
                  onClick={handleCustomSubmit}
                >
                  Confirm Course
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
