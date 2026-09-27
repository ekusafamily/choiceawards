import { useState } from 'react';
import { X } from 'lucide-react';

const PRESET_AMOUNTS = [
  { amount: 10, points: 10 },
  { amount: 20, points: 20 },
  { amount: 50, points: 50 },
  { amount: 100, points: 110 },
  { amount: 200, points: 220 },
  { amount: 500, points: 550 },
];

function calculatePoints(amount) {
  if (amount >= 100) return Math.floor(amount * 1.1);
  return amount;
}

export default function VoteModal({ nominee, onClose, onVote }) {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeAmount = selectedAmount || (customAmount ? parseInt(customAmount, 10) : 0);
  const activePoints = activeAmount >= 10 ? calculatePoints(activeAmount) : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (activeAmount < 10) {
      setError('Minimum voting amount is KSh 10');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await onVote({
        nominee_id: nominee.id,
        category_id: nominee.category_id,
        amount: activeAmount,
      });
    } catch (err) {
      setError(err.message || 'Failed to submit vote');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Vote modal">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            Vote for <span className="gold-accent">{nominee.name}</span>
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-text-muted)' }}>
              Select an amount to vote. KSh 100+ earns 1.1x bonus points.
            </p>

            <div className="vote-amounts">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset.amount}
                  type="button"
                  className={`vote-amount-btn ${selectedAmount === preset.amount ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedAmount(preset.amount);
                    setCustomAmount('');
                  }}
                >
                  <span className="amount">KSh {preset.amount}</span>
                  <span className="pts">{preset.points} pts</span>
                </button>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="custom-amount">Or enter custom amount (min KSh 10)</label>
              <input
                type="number"
                id="custom-amount"
                className="form-control"
                placeholder="Enter amount..."
                min={10}
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
              />
            </div>

            {activeAmount >= 10 && (
              <div
                style={{
                  padding: 'var(--space-md)',
                  background: 'var(--color-accent-dim)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                  border: '1px solid var(--color-accent)',
                }}
              >
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  You will cast
                </span>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '1.5rem',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-accent)',
                  }}
                >
                  {activePoints.toLocaleString()} points
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  for KSh {activeAmount.toLocaleString()}
                </span>
              </div>
            )}

            {error && <p className="form-error" style={{ marginTop: 'var(--space-md)' }}>{error}</p>}
          </div>

          <div className="modal-footer">
            <button
              type="submit"
              className="btn btn-gold btn-lg"
              style={{ width: '100%' }}
              disabled={activeAmount < 10 || loading}
              id="vote-submit-btn"
            >
              {loading ? 'Processing...' : 'Vote Now - M-Pesa (Coming Soon)'}
            </button>
            <p className="form-hint" style={{ textAlign: 'center', marginTop: 'var(--space-sm)' }}>
              M-Pesa integration will be activated soon
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
