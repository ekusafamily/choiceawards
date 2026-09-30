import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Trophy, User, Copy, Check } from 'lucide-react';
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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

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
    // Direct link to the nominee profile
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/nominees/${nominee.id}`
      : `https://demo.balktraders.site/nominees/${nominee.id}`;
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
                  className="share-btn share-btn-whatsapp"
                  onClick={() => handleShare('whatsapp')}
                  aria-label="Share on WhatsApp"
                  id="profile-share-whatsapp"
                >
                  <WhatsAppIcon size={16} className="whatsapp-icon" />
                  <span>WhatsApp</span>
                </button>
                <button
                  className="share-btn share-btn-twitter"
                  onClick={() => handleShare('twitter')}
                  aria-label="Share on X"
                  id="profile-share-x"
                >
                  <XIcon size={13} className="x-icon" />
                  <span>X</span>
                </button>
                <button
                  className="share-btn share-btn-facebook"
                  onClick={() => handleShare('facebook')}
                  aria-label="Share on Facebook"
                  id="profile-share-fb"
                >
                  <FacebookIcon size={14} className="fb-icon" />
                  <span>Facebook</span>
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

function WhatsAppIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.44 19.65L5.27 16.61L5.07 16.29C4.24 14.97 3.81 13.46 3.81 11.91C3.81 7.37 7.5 3.68 12.05 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.27 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.57 14.33C16.32 14.21 15.1 13.61 14.88 13.52C14.65 13.44 14.49 13.4 14.32 13.65C14.16 13.89 13.69 14.45 13.55 14.61C13.41 14.77 13.26 14.79 13.02 14.67C12.77 14.55 11.98 14.29 11.04 13.45C10.31 12.8 9.81 11.99 9.67 11.75C9.53 11.51 9.65 11.37 9.77 11.25C9.88 11.14 10.02 10.96 10.14 10.82C10.26 10.68 10.3 10.57 10.38 10.41C10.46 10.25 10.42 10.11 10.36 9.99C10.3 9.86 9.81 8.67 9.61 8.18C9.41 7.7 9.21 7.77 9.06 7.76L8.59 7.75C8.42 7.75 8.16 7.81 7.93 8.06C7.71 8.3 7.07 8.9 7.07 10.12C7.07 11.34 7.96 12.52 8.08 12.68C8.21 12.84 9.82 15.33 12.29 16.39C12.88 16.64 13.34 16.8 13.69 16.91C14.28 17.1 14.82 17.07 15.25 17.01C15.73 16.94 16.72 16.41 16.92 15.84C17.13 15.27 17.13 14.79 17.07 14.68C17.01 14.58 16.82 14.46 16.57 14.33Z" />
    </svg>
  );
}

function XIcon({ size = 14, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ size = 14, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
