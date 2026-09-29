import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Trophy, Share2, User, Copy, Check } from 'lucide-react';
import apiClient from '../api/client';
import VoteModal from '../components/VoteModal';

export default function NomineeProfile() {
  const { id } = useParams();
  const [nominee, setNominee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await apiClient.get(`/nominees/${id}`);
        setNominee(data);
      } catch (err) {
        console.error('Failed to load nominee:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  // Dynamically update document title and OpenGraph tags in DOM
  useEffect(() => {
    if (!nominee) return;
    document.title = `${nominee.name} - DeKUTSO Comrade Choice Award 2026`;

    function setMeta(property, content) {
      if (!content) return;
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }

    function setTwitterMeta(name, content) {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    }

    const catName = nominee.categories?.name || 'Category Nominee';
    const shareDesc = `Support ${nominee.name} (${nominee.course || 'DeKUT'}) in the DeKUTSO Comrade Choice Award 2026. Vote now!`;

    setMeta('og:title', `Vote for ${nominee.name} • ${catName}`);
    setMeta('og:description', shareDesc);
    setMeta('og:type', 'profile');
    if (nominee.photo_url) {
      setMeta('og:image', nominee.photo_url);
      setMeta('og:image:secure_url', nominee.photo_url);
      setTwitterMeta('twitter:image', nominee.photo_url);
    }
    setTwitterMeta('twitter:card', 'summary_large_image');
    setTwitterMeta('twitter:title', `Vote for ${nominee.name} • ${catName}`);
    setTwitterMeta('twitter:description', shareDesc);
  }, [nominee]);

  function handleVoteSuccess(voteResult) {
    setNominee((prev) => ({
      ...prev,
      total_points: (prev?.total_points || 0) + (voteResult.points || 0),
    }));
    setVoteSuccess(true);
    setTimeout(() => setVoteSuccess(false), 5000);
  }

  function handleShare(platform) {
    // Smart share URL that renders rich preview card with nominee's bucket photo on WhatsApp/Twitter/Facebook
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const serverBase = apiBase.replace(/\/api\/?$/, '');
    const shareUrl = `${serverBase}/share/nominee/${nominee.id}`;
    const text = `Vote for ${nominee.name} in the DeKUTSO Comrade Choice Award 2026!`;

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
      return;
    }

    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'noopener,noreferrer');
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  if (!nominee) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="error-state">
            <h2>Nominee Not Found</h2>
            <Link to="/categories" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>
              Browse Categories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categorySlug = nominee.categories?.slug;
  const categoryName = nominee.categories?.name;

  return (
    <div className="profile-page">
      <div className="container">
        {categorySlug && (
          <Link
            to={`/categories/${categorySlug}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-xs)',
              marginBottom: 'var(--space-lg)',
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
            }}
          >
            <ArrowLeft size={16} /> Back to {categoryName}
          </Link>
        )}

        {voteSuccess && (
          <div
            style={{
              padding: 'var(--space-md)',
              background: 'rgba(27, 94, 32, 0.1)',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 'var(--space-lg)',
              color: 'var(--color-success)',
              fontWeight: 600,
            }}
          >
            Vote submitted successfully. Thank you for your support.
          </div>
        )}

        <div className="profile-header">
          {nominee.photo_url ? (
            <img
              src={nominee.photo_url}
              alt={nominee.name}
              className="profile-photo"
            />
          ) : (
            <div
              className="profile-photo"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg-alt)',
              }}
            >
              <User size={80} color="var(--color-border)" />
            </div>
          )}

          <div className="profile-info">
            {categoryName && (
              <span className="profile-category">{categoryName}</span>
            )}
            <h1>{nominee.name}</h1>

            <div className="profile-meta">
              {nominee.course && (
                <span>
                  <BookOpen size={16} /> {nominee.course}
                </span>
              )}
              {nominee.year_of_study && (
                <span>{nominee.year_of_study.replace(/^year\s*/i, 'Year ')}</span>
              )}
            </div>

            <div className="profile-points-box">
              <Trophy size={24} />
              <div>
                <span className="points-num">
                  {(nominee.total_points || 0).toLocaleString()}
                </span>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>points</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <button
                className="btn btn-gold"
                onClick={() => setShowVoteModal(true)}
                id="profile-vote-btn"
              >
                Vote for {nominee.name.split(' ')[0]}
              </button>

              <div className="profile-share" style={{ marginTop: 0 }}>
                <button
                  className="share-btn"
                  onClick={() => handleShare('whatsapp')}
                  aria-label="Share on WhatsApp"
                >
                  <Share2 size={14} /> WhatsApp
                </button>
                <button
                  className="share-btn"
                  onClick={() => handleShare('twitter')}
                  aria-label="Share on X"
                >
                  <Share2 size={14} /> X
                </button>
                <button
                  className="share-btn"
                  onClick={() => handleShare('facebook')}
                  aria-label="Share on Facebook"
                >
                  <Share2 size={14} /> Facebook
                </button>
                <button
                  className={`share-btn ${copied ? 'copied' : ''}`}
                  onClick={() => handleShare('copy')}
                  aria-label="Copy nominee profile link"
                  id="profile-copy-btn"
                >
                  {copied ? <Check size={14} color="var(--color-primary)" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bio & Achievements */}
        {nominee.bio && (
          <div className="profile-bio">
            <h3>Biography</h3>
            <p>{nominee.bio}</p>
          </div>
        )}

        {nominee.achievements && (
          <div className="profile-bio">
            <h3>Achievements</h3>
            <p>{nominee.achievements}</p>
          </div>
        )}
      </div>

      {showVoteModal && (
        <VoteModal
          nominee={nominee}
          onClose={() => setShowVoteModal(false)}
          onSuccess={handleVoteSuccess}
        />
      )}
    </div>
  );
}
