import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, Sparkles, ChevronDown, ChevronUp, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { VOTING_DEADLINE_ISO, isVotingClosed } from '../utils/votingDeadline';

function padZero(num) {
  return String(Math.max(0, num)).padStart(2, '0');
}

function formatDeadlineTime(dateStr) {
  if (dateStr.includes('23:59')) return 'Midnight';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '11:20 PM';
  }
}

export default function CountdownStickyFooter() {
  const location = useLocation();
  const targetDateStr = VOTING_DEADLINE_ISO;

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
    // If deadline has passed, no need to tick down
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

  return (
    <>
      {/* Spacer so bottom page content / footer is not blocked by sticky bar */}
      <div className={`countdown-sticky-spacer ${isMinimized ? 'minimized' : ''}`} />

      <aside
        className={`countdown-sticky-footer ${timeLeft.isEnded ? 'is-polls-closed' : ''} ${
          isMinimized ? 'is-minimized' : ''
        }`}
        aria-label="Voting Deadline Status Bar"
        id="voting-countdown-bar"
      >
        <div className="countdown-sticky-inner container">
          {/* Left: Indicator & Headline */}
          <div className="countdown-sticky-left">
            {timeLeft.isEnded ? (
              <div className="countdown-sticky-badge countdown-sticky-badge-closed">
                <span className="ceremony-pulse-dot" />
                <Lock size={13} className="inline-icon" /> Verification Ongoing
              </div>
            ) : (
              <div className="countdown-sticky-badge">
                <span className="countdown-pulse-ring" />
                <span className="countdown-pulse-dot" />
                <span className="countdown-badge-text">
                  <Clock size={13} className="inline-icon" /> Voting Deadline
                </span>
              </div>
            )}

            <div className="countdown-sticky-titles">
              <h4 className="countdown-main-title">
                {timeLeft.isEnded ? 'Award Ceremony at Freedom Hall' : 'Voting Closes In'}
              </h4>
              <p className="countdown-sub-title">
                {timeLeft.isEnded ? (
                  <span>
                    Venue: <strong>Freedom Hall</strong> &bull; <em>Dates yet to be communicated</em> &bull; Official vote verification in progress.
                  </span>
                ) : (
                  <span>
                    Deadline: <strong>Tuesday, Oct 20 at {formatDeadlineTime(targetDateStr)} (EAT)</strong> • Vote in all categories!
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Center: Flip/Digit Countdown Grid OR Closed Notice */}
          <div className="countdown-sticky-center">
            {timeLeft.isEnded ? (
              <div className="countdown-closed-tag">
                <Sparkles size={14} style={{ color: 'var(--color-gold)' }} />
                <span>Freedom Hall &bull; Dates TBA</span>
              </div>
            ) : (
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
            )}
          </div>

          {/* Right: Actions & Minimize Button */}
          <div className="countdown-sticky-right">
            <div className="countdown-cta-group">
              {timeLeft.isEnded ? (
                <Link
                  to="/nominees"
                  className="btn btn-gold btn-sm countdown-cta-btn"
                  id="countdown-leaderboard-btn"
                >
                  <Trophy size={14} /> View Ranks
                </Link>
              ) : (
                <Link
                  to="/categories"
                  className="btn btn-gold btn-sm countdown-cta-btn"
                  id="countdown-vote-btn"
                >
                  <Sparkles size={14} /> Vote Now
                </Link>
              )}
              <Link
                to={timeLeft.isEnded ? '/categories' : '/nominees'}
                className="countdown-secondary-link"
                id="countdown-view-nominees-btn"
              >
                {timeLeft.isEnded ? 'Categories' : <><Trophy size={14} /> Nominees</>}
              </Link>
            </div>

            {/* Toggle minimize/expand for comfortable browsing */}
            <button
              type="button"
              className="countdown-minimize-btn"
              onClick={() => setIsMinimized((prev) => !prev)}
              aria-label={isMinimized ? 'Expand status bar' : 'Minimize status bar'}
              title={isMinimized ? 'Expand status bar' : 'Minimize status bar'}
            >
              {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
