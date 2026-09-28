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

