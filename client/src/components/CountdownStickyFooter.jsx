import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, Sparkles, ChevronDown, ChevronUp, Trophy } from 'lucide-react';

// Default fallback deadline: Tuesday, October 20, 2026 at 23:59:59 EAT (Kenyan time)
const DEFAULT_VOTING_DEADLINE = '2026-10-20T23:59:59+03:00';

function padZero(num) {
  return String(Math.max(0, num)).padStart(2, '0');
}

export default function CountdownStickyFooter() {
  const location = useLocation();

  // Read target date from .env (Vite client env variable)
  const targetDateStr =
    import.meta.env.VITE_VOTING_DEADLINE || DEFAULT_VOTING_DEADLINE;

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDateStr));
  const [isMinimized, setIsMinimized] = useState(false);

  function calculateTimeLeft(dateString) {
    const target = new Date(dateString).getTime();
    const now = Date.now();
    const diff = target - now;

    if (isNaN(target) || diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return { days, hours, minutes, seconds, isEnded: false };
  }

  useEffect(() => {
    // If deadline has passed, stop timer
    if (timeLeft.isEnded) return;

    const timer = setInterval(() => {
      const updated = calculateTimeLeft(targetDateStr);
      setTimeLeft(updated);
      if (updated.isEnded) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDateStr, timeLeft.isEnded]);

  // Hide on admin routes so admin panel has full screen space
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // Once countdown is done (deadline reached), disappear completely from the UI
  if (timeLeft.isEnded) {
    return null;
  }

  return (
    <>
      {/* Spacer so bottom page content / footer is not blocked by sticky bar */}
      <div className={`countdown-sticky-spacer ${isMinimized ? 'minimized' : ''}`} />

      <aside
        className={`countdown-sticky-footer ${isMinimized ? 'is-minimized' : ''}`}
        aria-label="Voting Deadline Countdown Bar"
        id="voting-countdown-bar"
      >
        <div className="countdown-sticky-inner container">
          {/* Left: Indicator & Headline */}
          <div className="countdown-sticky-left">
            <div className="countdown-sticky-badge">
              <span className="countdown-pulse-ring" />
              <span className="countdown-pulse-dot" />
              <span className="countdown-badge-text">
                <Clock size={13} className="inline-icon" /> Voting Deadline
              </span>
            </div>

            <div className="countdown-sticky-titles">
              <h4 className="countdown-main-title">Voting Closes In</h4>
              <p className="countdown-sub-title">
                Deadline: <strong>Tuesday, Oct 20 at Midnight (EAT)</strong> • Vote in all categories!
              </p>
            </div>
          </div>

          {/* Center: Flip/Digit Countdown Grid */}
          <div className="countdown-sticky-center">
            <div className="countdown-digits-grid">
              <div className="countdown-digit-box">
                <span className="countdown-digit-num">{padZero(timeLeft.days)}</span>
                <span className="countdown-digit-lbl">Days</span>
              </div>
              <span className="countdown-digit-separator">:</span>
              <div className="countdown-digit-box">
                <span className="countdown-digit-num">{padZero(timeLeft.hours)}</span>
                <span className="countdown-digit-lbl">Hours</span>
              </div>
              <span className="countdown-digit-separator">:</span>
              <div className="countdown-digit-box">
                <span className="countdown-digit-num">{padZero(timeLeft.minutes)}</span>
                <span className="countdown-digit-lbl">Mins</span>
              </div>
              <span className="countdown-digit-separator">:</span>
              <div className="countdown-digit-box countdown-digit-box-highlight">
                <span className="countdown-digit-num">{padZero(timeLeft.seconds)}</span>
                <span className="countdown-digit-lbl">Secs</span>
              </div>
            </div>
          </div>

          {/* Right: Actions & Minimize Button */}
          <div className="countdown-sticky-right">
            <div className="countdown-cta-group">
              <Link
                to="/categories"
                className="btn btn-gold btn-sm countdown-cta-btn"
                id="countdown-vote-btn"
              >
                <Sparkles size={14} /> Vote Now
              </Link>
              <Link
                to="/nominees"
                className="countdown-secondary-link"
                id="countdown-view-nominees-btn"
              >
                <Trophy size={14} /> Nominees
              </Link>
            </div>

            {/* Toggle minimize/expand for comfortable browsing */}
            <button
              type="button"
              className="countdown-minimize-btn"
              onClick={() => setIsMinimized((prev) => !prev)}
              aria-label={isMinimized ? 'Expand countdown bar' : 'Minimize countdown bar'}
              title={isMinimized ? 'Expand countdown bar' : 'Minimize countdown bar'}
            >
              {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
