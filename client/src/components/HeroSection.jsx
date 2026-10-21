import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';

const HERO_IMAGES = [
  '/heroes/DeKUT-view-scaled.jpg',
  '/heroes/DeKUT-Nominated-as-Best-Performing-Institution-by-the-Public-Service-Commission-March-2025.png',
  '/heroes/images.jpg',
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrev(current);
      setFading(true);
      setCurrent((c) => (c + 1) % HERO_IMAGES.length);
      // Clear the fade-out ghost after transition completes
      const t = setTimeout(() => {
        setPrev(null);
        setFading(false);
      }, 1200);
      return () => clearTimeout(t);
    }, 5000);
    return () => clearInterval(interval);
  }, [current]);

  return (
    <section className="hero" id="hero">
      {/* Crossfading background images */}
      {HERO_IMAGES.map((src, i) => (
        <div
          key={src}
          className="hero-bg-slide"
          aria-hidden="true"
          style={{
            backgroundImage: `url('${src}')`,
            opacity: i === current ? 1 : 0,
            transition: i === current ? 'opacity 1.2s ease-in-out' : 'opacity 0.8s ease-in-out',
          }}
        />
      ))}

      {/* Dark overlay for readability */}
      <div className="hero-bg-overlay" aria-hidden="true" />

      {/* Content */}
      <div className="container hero-content">
        <div className="hero-logo-wrap">
          <img src="/dekutso-logo.png" alt="DeKUTSO Comrade Choice Award" className="hero-brand-logo" />
        </div>
        <div className="hero-dekutso-badge">
          <span>DeKUT Students Organization (DeKUTSO)</span>
        </div>
        <div className="hero-ceremony-hall-badge">
          <span className="ceremony-pulse-dot" />
          <span>Award Ceremony: Freedom Hall (Dates TBA) &bull; Verification In Progress</span>
        </div>
        <h1>
          DeKUTSO <span className="gold-accent">Comrade Choice</span> Award
        </h1>
        <p className="hero-subtitle">
          The Premier Student Recognition Platform at Dedan Kimathi University of Technology
        </p>
        <p className="hero-tagline">
          Voting has concluded &bull; Verification ongoing &bull; Grand Ceremony at Freedom Hall
        </p>
        <div className="hero-actions">
          <a
            href="#ceremony-notice-section"
            className="btn btn-gold btn-lg"
            id="hero-ceremony-details-btn"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('ceremony-notice-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Ceremony at Freedom Hall
          </a>
          <Link
            to="/nominees"
            className="btn btn-outline btn-lg"
            style={{ borderColor: '#fff', color: '#fff' }}
            id="hero-nominees-btn"
          >
            View Nominees
          </Link>
        </div>

        {/* Slide indicator dots */}
        <div className="hero-dots" aria-label="Slideshow indicators">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

