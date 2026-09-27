import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';

export default function HeroSection() {
  return (
    <>
      <section className="hero" id="hero">
        <div className="container hero-content">
          <Award size={56} style={{ color: 'var(--color-accent)', marginBottom: '16px' }} />
          <h1>
            Comrade <span className="gold-accent">Choice</span> Awards
          </h1>
          <p className="hero-subtitle">
            An Awards Initiative for Dedan Kimathi University of Technology
          </p>
          <p className="hero-tagline">
            Your Voice. Your Choice. Your Campus.
          </p>
          <div className="hero-actions">
            <Link to="/nominate" className="btn btn-gold btn-lg" id="hero-nominate-btn">
              Nominate Now
            </Link>
            <Link to="/categories" className="btn btn-outline btn-lg" style={{ borderColor: '#fff', color: '#fff' }} id="hero-categories-btn">
              View Categories
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
