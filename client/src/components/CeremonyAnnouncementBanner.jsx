import { useState } from 'react';
import { Award, MapPin, Calendar, ShieldCheck, ChevronRight, X } from 'lucide-react';

export default function CeremonyAnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  function scrollToNotice(e) {
    e.preventDefault();
    const el = document.getElementById('ceremony-notice-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = '/#ceremony-notice-section';
    }
  }

  return (
    <div className="ceremony-top-banner" role="region" aria-label="Official Ceremony and Verification Announcement">
      <div className="container ceremony-top-banner-inner">
        <div className="ceremony-top-banner-left">
          <div className="ceremony-status-pill">
            <span className="ceremony-pulse-dot" />
            <ShieldCheck size={14} className="ceremony-status-icon" />
            <span>Verification Ongoing</span>
          </div>

          <div className="ceremony-top-banner-text">
            <span className="ceremony-top-banner-headline">
              Voting has concluded &amp; vote verification is actively ongoing.
            </span>
            <span className="ceremony-top-banner-details">
              The Grand Award Ceremony will be held at{' '}
              <strong className="ceremony-highlight">
                <MapPin size={13} className="inline-icon" /> Freedom Hall
              </strong>
              {' '}&bull;{' '}
              <span className="ceremony-date-notice">
                <Calendar size={13} className="inline-icon" /> Dates are yet to be communicated
              </span>
            </span>
          </div>
        </div>

        <div className="ceremony-top-banner-actions">
          <a
            href="#ceremony-notice-section"
            onClick={scrollToNotice}
            className="ceremony-top-banner-btn"
          >
            <span>Ceremony Details</span>
            <ChevronRight size={14} />
          </a>
          <button
            type="button"
            className="ceremony-top-banner-dismiss"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
