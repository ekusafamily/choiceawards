import { Link } from 'react-router-dom';
import { Award, MapPin, Mail, ExternalLink, ShieldCheck, Trophy, Sparkles, MessageSquare } from 'lucide-react';
import { openContactDrawer, OFFICIAL_EMAIL } from './ContactDrawer';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      {/* Gold Institutional Accent Stripe */}
      <div className="footer-gold-stripe" />

      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Mission */}
          <div className="footer-col footer-col-brand">
            <div className="footer-brand-header">
              <div className="footer-brand-crest">
                <img src="/dekutso-logo.png" alt="DeKUTSO Logo" className="footer-brand-logo" />
              </div>
              <div>
                <h3 className="footer-brand-title">DeKUTSO Comrade Choice Award</h3>
                <span className="footer-brand-sub">Dedan Kimathi University of Technology</span>
              </div>
            </div>

            <p className="footer-description">
              The official annual recognition initiative dedicated to celebrating outstanding student
              leaders, innovators, creators, sports personalities, and student associations at DeKUT.
            </p>

            <div className="footer-badges">
              <span className="footer-badge">
                <ShieldCheck size={13} /> DeKUTSO Initiative
              </span>
              <span className="footer-badge">
                <Sparkles size={13} /> 2026 Edition
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Awards Portal</h4>
            <ul className="footer-col-links">
              <li>
                <Link to="/">Home & Categories</Link>
              </li>
              {/* Top Nominees hidden during nomination phase */}
              {/* <li>
                <Link to="/nominees">
                  <Trophy size={13} className="inline-icon" /> Top Nominees
                </Link>
              </li> */}
              <li>
                <Link to="/nominate">Submit a Nomination</Link>
              </li>
              <li>
                <Link to="/successful-nominations">Successful Nominations</Link>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={openContactDrawer}
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: University Ecosystem Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">DeKUT Ecosystem</h4>
            <ul className="footer-col-links">
              <li>
                <a
                  href="https://www.dkut.ac.ke/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  DeKUT Main Website <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://studentwelfare.dkut.ac.ke/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  Directorate of Students Welfare <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <span className="footer-text-muted">DeKUT Students Organization (DeKUTSO)</span>
              </li>
              <li>
                <span className="footer-text-muted">Clubs & Student Associations</span>
              </li>
              <li>
                <span className="footer-text-muted">Hosted on dekutso.com</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Campus Location & Support */}
          <div className="footer-col">
            <h4 className="footer-col-title">Campus & Inquiries</h4>
            <ul className="footer-contact-list">
              <li>
                <MapPin size={16} className="contact-icon" />
                <span>
                  Main Campus, Nyeri, Kenya<br />
                  Private Bag - 10143 Dedan Kimathi
                </span>
              </li>
              <li>
                <Mail size={16} className="contact-icon" />
                <a href={`mailto:${OFFICIAL_EMAIL}`}>{OFFICIAL_EMAIL}</a>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-contact-open-btn"
                  onClick={openContactDrawer}
                >
                  <MessageSquare size={13} /> Send Message to Committee
                </button>
              </li>
            </ul>

            <div className="footer-motto-box">
              <span className="motto-label">University Motto</span>
              <p className="motto-text">"Better Life Through Technology"</p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="footer-bottom">
          <p className="footer-copy">
            &copy; {year} DeKUTSO — Dedan Kimathi University of Technology Students Organization. All Rights Reserved.
          </p>
          <p className="footer-disclaimer">
            DeKUTSO Comrade Choice Award • Celebrating Student Excellence & Leadership
          </p>
        </div>
      </div>
    </footer>
  );
}
