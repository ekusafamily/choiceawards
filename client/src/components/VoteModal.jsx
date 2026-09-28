import { useState } from 'react';
import { X, Trophy, User, CheckCircle2 } from 'lucide-react';

const VOTE_OPTIONS = [
  { votes: 1, points: 10, label: '1 Vote' },
  { votes: 5, points: 50, label: '5 Votes' },
  { votes: 10, points: 100, label: '10 Votes' },
];

export default function VoteModal({ nominee, onClose, onVote }) {
  const [selectedVotes, setSelectedVotes] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentOption = VOTE_OPTIONS.find((o) => o.votes === selectedVotes) || VOTE_OPTIONS[0];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onVote({
        nominee_id: nominee.id,
        category_id: nominee.category_id,
        amount: currentOption.points,
      });
    } catch (err) {
      setError(err.message || 'Failed to submit vote. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Vote modal"
    >
      <div className="modal voter-card-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="voter-modal-header">
          <div className="voter-header-title">
            <Trophy size={18} className="gold-accent-icon" />
            <span>Cast Your Vote</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body voter-card-body">
            {/* Nominee Identity Card */}
            <div className="voter-nominee-preview">
              <div className="voter-avatar-wrap">
                {nominee.photo_url ? (
                  <img src={nominee.photo_url} alt={nominee.name} className="voter-avatar-img" />
                ) : (
                  <div className="voter-avatar-placeholder">
                    <User size={28} />
                  </div>
                )}
              </div>
              <div className="voter-nominee-info">
                <span className="voter-category-badge">
                  {nominee.categories?.name || nominee.category_name || 'Category Nominee'}
                </span>
                <h3 className="voter-nominee-name">{nominee.name}</h3>
                {nominee.course && (
                  <p className="voter-nominee-course">
                    {nominee.course}
                    {nominee.year_of_study
                      ? ` • ${nominee.year_of_study.replace(/^year\s*/i, 'Year ')}`
                      : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Clean Vote Selection */}
            <div className="voter-choice-section">
              <label className="voter-section-label">Select Votes to Cast</label>
              <div className="voter-options-grid">
                {VOTE_OPTIONS.map((opt) => {
                  const isSelected = selectedVotes === opt.votes;
                  return (
                    <button
                      key={opt.votes}
                      type="button"
                      className={`voter-pill-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedVotes(opt.votes)}
                    >
                      <span className="voter-pill-label">{opt.label}</span>
                      <span className="voter-pill-pts">{opt.points} pts</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="form-error" style={{ marginTop: 'var(--space-md)' }}>{error}</p>}
          </div>

          {/* Modal Actions */}
          <div className="modal-footer voter-modal-footer">
            <button
              type="submit"
              className="btn btn-gold btn-lg voter-confirm-btn"
              disabled={loading}
              id="vote-submit-btn"
            >
              {loading ? (
                'Submitting Vote...'
              ) : (
                <>
                  <CheckCircle2 size={18} /> Confirm {currentOption.label} ({currentOption.points} pts)
                </>
              )}
            </button>
            <p className="voter-ballot-notice">
              Official Comrade Choice Awards 2026 Ballot
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
