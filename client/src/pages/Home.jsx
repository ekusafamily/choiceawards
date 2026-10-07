import { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/client';
import HeroSection from '../components/HeroSection';
import StatsBar from '../components/StatsBar';
import LandingSearchBar from '../components/LandingSearchBar';
import CategoryCard from '../components/CategoryCard';
import NomineeCard from '../components/NomineeCard';
import VoteModal from '../components/VoteModal';
import { Target, CheckCircle2, Globe, Sparkles, HeartHandshake, Award, User, X } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [allNominees, setAllNominees] = useState([]);
  const [stats, setStats] = useState({ categoriesCount: 26, nomineesCount: 0, votesCount: 0 });
  const [nomineeCountMap, setNomineeCountMap] = useState({});
  const [topNomineeMap, setTopNomineeMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [votingNominee, setVotingNominee] = useState(null);

  useEffect(() => {
    document.title = 'DeKUTSO Comrade Choice Award 2026 | Dedan Kimathi University of Technology';
    const setMeta = (prop, val) => {
      const el = document.querySelector(`meta[property="${prop}"]`);
      if (el) el.setAttribute('content', val);
    };
    const setTwitter = (name, val) => {
      const el = document.querySelector(`meta[name="${name}"]`);
      if (el) el.setAttribute('content', val);
    };
    setMeta('og:title', 'DeKUTSO Comrade Choice Awards 2026 | Dedan Kimathi University of Technology');
    setMeta('og:description', 'Nominate, vote, and celebrate campus excellence at Dedan Kimathi University of Technology across 26 categories.');
    setMeta('og:image', 'https://dekutsochoiceawards.site/homepage-share-preview.png');
    setMeta('og:image:secure_url', 'https://dekutsochoiceawards.site/homepage-share-preview.png');
    setTwitter('twitter:image', 'https://dekutsochoiceawards.site/homepage-share-preview.png');

    async function fetchData() {
      try {
        const [catsRes, statsRes, nomRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/stats').catch(() => ({ data: null })),
          apiClient.get('/nominees').catch(() => ({ data: [] })),
        ]);

        // Count nominees per category for sorting + build top-3 map
        const nominees = nomRes.data || [];
        setAllNominees(nominees);

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

  function handleVoteSuccess(voteResult) {
    setAllNominees((prev) =>
      prev.map((n) =>
        n.id === voteResult.nominee_id
          ? { ...n, total_points: (n.total_points || 0) + (voteResult.points || 0) }
          : n
      )
    );
    setStats((prev) => ({
      ...prev,
      votesCount: (prev.votesCount || 0) + (voteResult.votes || 1),
    }));
  }

  const query = searchQuery.trim().toLowerCase();

  // Filtered nominees when search query is active
  const filteredNominees = useMemo(() => {
    if (!query) return [];
    return allNominees.filter((n) => {
      const name = (n.name || '').toLowerCase();
      const course = (n.course || '').toLowerCase();
      const catName = (n.categories?.name || '').toLowerCase();
      const bio = (n.bio || '').toLowerCase();
      return (
        name.includes(query) ||
        course.includes(query) ||
        catName.includes(query) ||
        bio.includes(query)
      );
    });
  }, [allNominees, query]);

  // Filtered categories when search query is active
  const filteredCategories = useMemo(() => {
    if (!query) return categories;
    return categories.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const slug = (c.slug || '').toLowerCase();
      return name.includes(query) || desc.includes(query) || slug.includes(query);
    });
  }, [categories, query]);

  const individualCategories = (query ? filteredCategories : categories).filter(
    (c) => c.type === 'individual'
  );
  const orgCategories = (query ? filteredCategories : categories).filter(
    (c) => c.type === 'organization'
  );

  const purposePillars = [
    'Celebrate outstanding DeKUT students and student leaders.',
    'Recognize talent, creativity, leadership, innovation, and service.',
    'Give students an opportunity to recognize their peers.',
    'Promote positive participation in university life.',
    'Recognize active student associations and clubs.',
    'Provide visibility to student talent and initiatives.',
    'Create an annual platform for celebrating the DeKUT student community.',
  ];

  const isSearching = Boolean(query);

  return (
    <>
      <HeroSection />
      <StatsBar
        categoriesCount={stats.categoriesCount || categories.length}
        nomineesCount={stats.nomineesCount}
        votesCount={stats.votesCount}
      />

      {/* Prominent Search Bar Section */}
      <LandingSearchBar
        categories={categories}
        nominees={allNominees}
        nomineeCountMap={nomineeCountMap}
        onVote={(nom) => setVotingNominee(nom)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* When actively searching: Show in-page search results section */}
      {isSearching && (
        <section className="search-results-section" id="search-results">
          <div className="container">
            <div className="search-results-header">
              <div className="search-results-title">
                <h3>
                  Search Results for &ldquo;<strong>{searchQuery}</strong>&rdquo;
                </h3>
                <p>
                  Found {filteredNominees.length} {filteredNominees.length === 1 ? 'nominee' : 'nominees'} and{' '}
                  {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
                </p>
              </div>
              <button
                type="button"
                className="search-results-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} /> Clear Search
              </button>
            </div>

            {/* Matching Nominees Grid */}
            {filteredNominees.length > 0 && (
              <div style={{ marginBottom: 'var(--space-2xl)' }}>
                <h4
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1.25rem',
                    color: 'var(--color-primary)',
                    marginBottom: 'var(--space-lg)',
                  }}
                >
                  <User size={20} /> Nominees Matching &ldquo;{searchQuery}&rdquo; ({filteredNominees.length})
                </h4>
                <div className="nominees-grid">
                  {filteredNominees.map((nom) => (
                    <NomineeCard
                      key={nom.id}
                      nominee={nom}
                      onVote={(n) => setVotingNominee(n)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Matching Categories Grid */}
            {filteredCategories.length > 0 && (
              <div>
                <h4
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1.25rem',
                    color: 'var(--color-primary)',
                    marginBottom: 'var(--space-lg)',
                  }}
                >
                  <Award size={20} /> Categories Matching &ldquo;{searchQuery}&rdquo; ({filteredCategories.length})
                </h4>
                <div className="categories-grid">
                  {filteredCategories.map((cat) => (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      nomineeCount={nomineeCountMap[cat.id] || 0}
                      topNominees={topNomineeMap[cat.id] || []}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredNominees.length === 0 && filteredCategories.length === 0 && (
              <div className="empty-state">
                <p>No nominees or categories matched your search &ldquo;<strong>{searchQuery}</strong>&rdquo;.</p>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  Try searching for another keyword or check out our full list of categories below.
                </span>
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setSearchQuery('')}
                  >
                    View All Categories
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 1. Introduction & 2. Purpose of the Initiative (Shown when not searching) */}
      {!isSearching && (
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
                  The <strong>DeKUTSO Comrade Choice Award</strong> is the official student recognition awards initiative hosted by the <strong>DeKUT Students Organization (DeKUTSO)</strong> for the students of <strong>Dedan Kimathi University of Technology</strong>.
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
                The DeKUTSO Comrade Choice Award aims to:
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
      )}

      {/* Featured Categories (Shown when not searching) */}
      {!isSearching && (
        <section className="section" id="featured-categories">
          <div className="container">
            <div className="section-title">
              <h2>Award Categories</h2>
              <hr className="gold-line" />
              <p>
                25+ categories covering individual achievements, student organizations,
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
      )}

      {/* How It Works (Shown when not searching) */}
      {!isSearching && (
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
      )}

      {/* Global Vote Modal triggered from search results */}
      {votingNominee && (
        <VoteModal
          nominee={votingNominee}
          onClose={() => setVotingNominee(null)}
          onSuccess={handleVoteSuccess}
        />
      )}
    </>
  );
}
