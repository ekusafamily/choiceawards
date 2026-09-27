import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import HeroSection from '../components/HeroSection';
import StatsBar from '../components/StatsBar';
import CategoryCard from '../components/CategoryCard';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ categoriesCount: 19, nomineesCount: 0, votesCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, statsRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/stats').catch(() => ({ data: null })),
        ]);
        setCategories(catsRes.data);
        if (statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const individualCategories = categories.filter((c) => c.type === 'individual');
  const orgCategories = categories.filter((c) => c.type === 'organization');

  return (
    <>
      <HeroSection />
      <StatsBar
        categoriesCount={stats.categoriesCount || categories.length}
        nomineesCount={stats.nomineesCount}
        votesCount={stats.votesCount}
      />

      {/* Featured Categories */}
      <section className="section" id="featured-categories">
        <div className="container">
          <div className="section-title">
            <h2>Award Categories</h2>
            <hr className="gold-line" />
            <p>
              20+ categories covering individual achievements, student organizations,
              and special recognition.
            </p>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
            </div>
          ) : (
            <>
              {individualCategories.length > 0 && (
                <>
                  <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-primary)' }}>
                    Individual Awards
                  </h3>
                  <div className="categories-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
                    {individualCategories.map((cat) => (
                      <CategoryCard key={cat.id} category={cat} />
                    ))}
                  </div>
                </>
              )}

              {orgCategories.length > 0 && (
                <>
                  <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-primary)' }}>
                    Organization Awards
                  </h3>
                  <div className="categories-grid">
                    {orgCategories.map((cat) => (
                      <CategoryCard key={cat.id} category={cat} />
                    ))}
                  </div>
                </>
              )}

              {categories.length === 0 && !loading && (
                <div className="empty-state">
                  <p>Categories will be available soon. Check back later.</p>
                </div>
              )}
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
            <Link to="/categories" className="btn btn-outline" id="view-all-categories-btn">
              View All Categories
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        className="section"
        style={{ background: 'var(--color-bg-section)' }}
        id="how-it-works"
      >
        <div className="container">
          <div className="section-title">
            <h2>How It Works</h2>
            <hr className="gold-line" />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-xl)',
              maxWidth: '900px',
              margin: '0 auto',
            }}
          >
            {[
              {
                step: '01',
                title: 'Nominate',
                desc: 'Submit nominations for individuals or organizations across 20+ categories.',
              },
              {
                step: '02',
                title: 'Review',
                desc: 'Nominations undergo review to ensure credibility and integrity of the awards.',
              },
              {
                step: '03',
                title: 'Vote',
                desc: 'Support your favourite nominees by purchasing votes. KSh 10 = 10 points.',
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-xl)',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-light)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: 'var(--color-accent)',
                    display: 'block',
                    marginBottom: 'var(--space-sm)',
                  }}
                >
                  {item.step}
                </span>
                <h4 style={{ marginBottom: 'var(--space-sm)' }}>{item.title}</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
