import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown, Check, X } from 'lucide-react';

const YEAR_OPTIONS = [
  { value: '1', label: 'Year 1' },
  { value: '2', label: 'Year 2' },
  { value: '3', label: 'Year 3' },
  { value: '4', label: 'Year 4' },
  { value: '5', label: 'Year 5' },
  { value: 'postgrad', label: 'Postgraduate' },
];

export default function YearSelect({
  value = '',
  onChange,
  name = 'year_of_study',
  id = 'year_of_study',
  placeholder = 'Select year of study...',
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const listRef = useRef(null);

  // Find currently selected label
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return YEAR_OPTIONS.find((opt) => String(opt.value) === String(value)) || null;
  }, [value]);

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

  function handleSelect(yearVal) {
    notifyChange(yearVal);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleClear(e) {
    e.stopPropagation();
    notifyChange('');
    setActiveIndex(-1);
  }

  function handleToggleOpen() {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
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
      setActiveIndex((prev) => (prev < YEAR_OPTIONS.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : YEAR_OPTIONS.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < YEAR_OPTIONS.length) {
        handleSelect(YEAR_OPTIONS[activeIndex].value);
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
          <Calendar size={18} className="course-trigger-icon year-trigger-icon" />
          <span className={`course-select-label ${!selectedOption ? 'is-placeholder' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
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
              title="Clear year"
              aria-label="Clear year"
            >
              <X size={15} />
            </span>
          )}
          <ChevronDown size={18} className={`course-chevron ${isOpen ? 'rotate' : ''}`} />
        </span>
      </button>

      {/* Dropdown panel - no search bar as there are only 6 options */}
      {isOpen && (
        <div className="course-dropdown-menu custom-dropdown-menu" role="listbox">
          <div className="course-options-list" ref={listRef} style={{ maxHeight: 'none', padding: '6px 0' }}>
            {YEAR_OPTIONS.map((opt, idx) => {
              const isSelected = String(value) === String(opt.value);
              const isActive = activeIndex === idx;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`course-option-item ${isSelected ? 'selected' : ''} ${
                    isActive ? 'active' : ''
                  }`}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <span className="course-item-bullet year-bullet" />
                  <span className="course-item-name">{opt.label}</span>
                  {isSelected && <Check size={16} className="course-check-icon" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
