import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import HeroSection from '../components/HeroSection';
import StatsBar from '../components/StatsBar';
import CategoryCard from '../components/CategoryCard';
import { Target, CheckCircle2, Globe, Sparkles, HeartHandshake, Award } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ categoriesCount: 20, nomineesCount: 0, votesCount: 0 });
  const [nomineeCountMap, setNomineeCountMap] = useState({});
  const [topNomineeMap, setTopNomineeMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, statsRes, nomRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/stats').catch(() => ({ data: null })),
          apiClient.get('/nominees').catch(() => ({ data: [] })),
        ]);

        // Count nominees per category for sorting + build top-3 map
        const nominees = nomRes.data || [];
        const countMap = {};
        const top3Map = {};
        nominees.forEach((n) => {
          countMap[n.category_id] = (countMap[n.category_id] || 0) + 1;
          // nominees sorted desc by total_points from backend — keep first 3
          if (!top3Map[n.category_id]) top3Map[n.category_id] = [];
          if (top3Map[n.category_id].length < 3) {
            top3Map[n.category_id].push(n);
          }
        });

        // Sort categories by nominee count descending
        const sorted = (catsRes.data || []).slice().sort(
          (a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0)
        );

        setCategories(sorted);
        setNomineeCountMap(countMap);
        setTopNomineeMap(top3Map);
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

  const purposePillars = [
    'Celebrate outstanding DeKUT students and student leaders.',
    'Recognize talent, creativity, leadership, innovation, and service.',
    'Give students an opportunity to recognize their peers.',
    'Promote positive participation in university life.',
    'Recognize active student associations and clubs.',
    'Provide visibility to student talent and initiatives.',
    'Create an annual platform for celebrating the DeKUT student community.',
  ];

  return (
    <>
      <HeroSection />
      <StatsBar
        categoriesCount={stats.categoriesCount || categories.length}
        nomineesCount={stats.nomineesCount}
        votesCount={stats.votesCount}
      />

      {/* 1. Introduction & 2. Purpose of the Initiative */}
      <section className="section initiative-overview-section" id="about-initiative">
        <div className="container">
          {/* 1. Introduction */}
          <div className="initiative-card">
            <div className="initiative-header">
              <span className="initiative-number-badge">1</span>
              <div>
                <h2>INTRO</h2>
                <div className="initiative-tagline">DeKUT Student Recognition Initiative</div>
              </div>
            </div>
            <hr className="gold-line initiative-gold-line" />

            <div className="initiative-body">
              <p className="initiative-lead-text">
                The <strong>Comrade Choice Awards</strong> is a proposed student awards initiative designed specifically for the students of <strong>Dedan Kimathi University of Technology (DeKUT)</strong>.
              </p>
              <p className="initiative-sub-text">
                The initiative seeks to create a platform through which DeKUT students can recognize, celebrate, and appreciate fellow students, student leaders, associations, clubs, creators, athletes, entrepreneurs, and other personalities who contribute to campus life.
              </p>

              <div className="initiative-platform-callout">
                <Globe size={22} className="platform-icon" />
                <p>
                  Vote for your favourite Personalities and groups
                </p>
              </div>
            </div>

            <div className="initiative-divider-line" />

            {/* 2. Purpose of the Initiative */}
            <div className="initiative-header" style={{ marginTop: 'var(--space-2xl)' }}>
              <span className="initiative-number-badge">2</span>
              <div>
                <h2>Purpose of the Initiative</h2>
                <div className="initiative-tagline">Core Objectives & Impact</div>
              </div>
            </div>
            <hr className="gold-line initiative-gold-line" />

            <p className="purpose-intro-text">
              The Comrade Choice Awards aims to:
            </p>

            <div className="purpose-grid">
              {purposePillars.map((text, idx) => (
                <div key={idx} className="purpose-item-card">
                  <div className="purpose-item-icon">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="purpose-item-text">{text}</span>
                </div>
              ))}
            </div>

            <div className="student-driven-banner">
              <HeartHandshake size={28} className="banner-icon" />
              <div className="banner-text">
                <strong>Student-Centered & Student-Driven</strong>
                <p>The initiative will be student-centered and student-driven, with participation coming from across the DeKUT student community.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                      <CategoryCard
                        key={cat.id}
                        category={cat}
                        nomineeCount={nomineeCountMap[cat.id] || 0}
                        topNominees={topNomineeMap[cat.id] || []}
                      />
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
                      <CategoryCard
                        key={cat.id}
                        category={cat}
                        nomineeCount={nomineeCountMap[cat.id] || 0}
                        topNominees={topNomineeMap[cat.id] || []}
                      />
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
                desc: 'Support your favourite nominees by voting',
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
