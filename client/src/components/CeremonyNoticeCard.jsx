import { MapPin, Calendar, ShieldCheck, Trophy, Sparkles, CheckCircle2, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CeremonyNoticeCard() {
  return (
    <section className="ceremony-notice-section" id="ceremony-notice-section">
      <div className="container">
        <div className="ceremony-notice-wrapper">
          {/* Header */}
          <div className="ceremony-notice-header">
            <div className="ceremony-notice-badge-group">
              <span className="ceremony-notice-pillar-badge">
                <ShieldCheck size={14} className="inline-icon" /> Official DeKUTSO Notice
              </span>
              <span className="ceremony-live-audit-badge">
                <span className="ceremony-pulse-dot" /> Live Vote Verification
              </span>
            </div>

            <h2 className="ceremony-notice-title">
              Vote Verification Ongoing &amp; Award Ceremony at{' '}
              <span className="gold-accent-text">Freedom Hall</span>
            </h2>

            <p className="ceremony-notice-subtitle">
              Voting for the 2026 DeKUTSO Comrade Choice Awards has officially concluded. All cast votes and category
              standings are currently undergoing a comprehensive verification audit by the DeKUTSO Electoral &amp; Awards Committee.
            </p>
          </div>

          {/* 3 Information Pillars */}
          <div className="ceremony-notice-grid">
            {/* Card 1: Verification Ongoing */}
            <div className="ceremony-card ceremony-card-audit">
              <div className="ceremony-card-icon-wrap icon-gold">
                <ShieldCheck size={28} />
              </div>
              <div className="ceremony-card-meta">
                <span className="ceremony-card-tag">Ballot Integrity</span>
                <span className="ceremony-card-status-badge status-verifying">In Progress</span>
              </div>
              <h3 className="ceremony-card-heading">Vote Verification Ongoing</h3>
              <p className="ceremony-card-desc">
                In strict adherence to fairness and credibility, all submitted ballots across all 26 categories
                are being independently audited and verified to reconcile final vote tallies and eliminate discrepancies.
              </p>
              <div className="ceremony-card-highlight-bar">
                <CheckCircle2 size={15} style={{ color: 'var(--color-primary, #1B5E20)' }} />
                <span>Ranks preserved &bull; Final winners will be officially certified</span>
              </div>
            </div>

            {/* Card 2: Venue Freedom Hall */}
            <div className="ceremony-card ceremony-card-venue highlight-border">
              <div className="ceremony-card-icon-wrap icon-primary">
                <MapPin size={28} />
              </div>
              <div className="ceremony-card-meta">
                <span className="ceremony-card-tag">Official Venue</span>
                <span className="ceremony-card-status-badge status-confirmed">Confirmed Venue</span>
              </div>
              <h3 className="ceremony-card-heading">Gala Ceremony: Freedom Hall</h3>
              <p className="ceremony-card-desc">
                The grand celebration of student excellence and award presentation will take place live at{' '}
                <strong>Freedom Hall</strong>, Dedan Kimathi University of Technology (Main Campus).
              </p>
              <div className="ceremony-card-highlight-bar venue-bar">
                <Trophy size={15} style={{ color: 'var(--color-accent, #D4A017)' }} />
                <span><strong>Freedom Hall</strong> &bull; DeKUT Main Campus</span>
              </div>
            </div>

            {/* Card 3: Dates Yet To Be Communicated */}
            <div className="ceremony-card ceremony-card-date">
              <div className="ceremony-card-icon-wrap icon-blue">
                <Calendar size={28} />
              </div>
              <div className="ceremony-card-meta">
                <span className="ceremony-card-tag">Ceremony Schedule</span>
                <span className="ceremony-card-status-badge status-pending">Pending Announcement</span>
              </div>
              <h3 className="ceremony-card-heading">Dates Yet To Be Communicated</h3>
              <p className="ceremony-card-desc">
                The official date and full program schedule for the Freedom Hall Ceremony will be announced
                shortly once the audit and certification process has been formally concluded.
              </p>
              <div className="ceremony-card-highlight-bar date-bar">
                <Clock size={15} style={{ color: '#0284C7' }} />
                <span>Official communications will follow via DeKUTSO</span>
              </div>
            </div>
          </div>

          {/* Footer Note & Quick Action */}
          <div className="ceremony-notice-footer">
            <div className="ceremony-footer-text">
              <Sparkles size={18} className="gold-sparkle-icon" />
              <span>
                Thank you to the entire DeKUT student fraternity for championing campus excellence and leadership!
              </span>
            </div>
            <div className="ceremony-footer-actions">
              <a href="#featured-categories" className="btn btn-gold btn-sm">
                <Award size={14} /> Explore Award Categories
              </a>
              <Link to="/nominees" className="btn btn-outline btn-sm">
                <Trophy size={14} /> View Nominees
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
