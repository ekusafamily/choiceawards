import { useState, useEffect, useRef } from 'react';
import {
  X, Trophy, User, CheckCircle2, Smartphone, Loader2,
  AlertCircle, RefreshCw, ShieldCheck, Sparkles
} from 'lucide-react';
import apiClient from '../api/client';

const VOTE_OPTIONS = [
  { votes: 10, amount: 10, points: 10, label: '10 Votes' },
  { votes: 20, amount: 20, points: 20, label: '20 Votes' },
  { votes: 50, amount: 50, points: 50, label: '50 Votes' },
  { votes: 100, amount: 100, points: 110, label: '100 Votes (+10% Bonus)' },
];

export default function VoteModal({ nominee, onClose, onVote, onSuccess }) {
  // Selection state
  const [selectedVotes, setSelectedVotes] = useState(10);
  const [customVotes, setCustomVotes] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [phone, setPhone] = useState(() => localStorage.getItem('cca_voter_phone') || '');

  // Payment state machine: 'select' | 'initiating' | 'waiting' | 'success' | 'failed'
  const [step, setStep] = useState('select');
  const [error, setError] = useState('');
  const [activeReference, setActiveReference] = useState(null);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [completedData, setCompletedData] = useState(null);

  const pollTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPollingRef = useRef(false);

  function stopPolling() {
    isPollingRef.current = false;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, []);

  // Compute final votes and amount (1 vote = 1 KES, minimum 10 KES)
  const currentVotes = isCustom
    ? Math.max(10, parseInt(customVotes, 10) || 10)
    : selectedVotes;
  const currentAmount = currentVotes; // 1 bob per vote

  function handleSelectOption(optVotes) {
    setIsCustom(false);
    setSelectedVotes(optVotes);
    setError('');
  }

  function handleCustomChange(e) {
    const val = e.target.value.replace(/\D/g, '');
    setCustomVotes(val);
    if (val) {
      setIsCustom(true);
      if (parseInt(val, 10) < 10) {
        setError('Minimum voting amount is KSh 10 (10 votes).');
      } else {
        setError('');
      }
    }
  }

  // Validate Kenyan phone format
  function validatePhone(p) {
    if (!p) return 'Please enter your M-Pesa phone number.';
    const cleaned = p.replace(/[\s\-\+\(\)]/g, '');
    if (!/^(07|01|2547|2541|\+2547|\+2541)\d{8}$/.test(cleaned)) {
      return 'Enter a valid Kenyan Safaricom phone number (e.g. 0712345678 or 0112345678).';
    }
    return null;
  }

  // Step 1: Initiate STK Push
  async function handleInitiate(e) {
    e.preventDefault();
    setError('');

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (isCustom && customVotes && parseInt(customVotes, 10) < 10) {
      setError('Minimum voting amount is KSh 10 (10 votes).');
      return;
    }

    if (currentAmount < 10) {
      setError('Minimum voting amount is KSh 10 (10 votes).');
      return;
    }

    // Save phone for future convenience
    localStorage.setItem('cca_voter_phone', phone.trim());

    setStep('initiating');

    try {
      const res = await apiClient.post('/votes/initiate', {
        nominee_id: nominee.id,
        category_id: nominee.category_id,
        amount: currentAmount,
        phone: phone.trim(),
        votes_count: currentVotes,
        nominee_name: nominee.name,
      });

      if (res.data?.success && res.data.reference) {
        setActiveReference(res.data.reference);
        setStep('waiting');
        startPolling(res.data.reference);
      } else {
        throw new Error(res.data?.error?.message || 'Failed to dispatch M-Pesa push.');
      }
    } catch (err) {
      console.error('STK push error:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to start payment. Please check your network and phone number.');
      setStep('select');
    }
  }

  // Step 2: Sequential Polling (prevents overlapping requests)
  function startPolling(reference) {
    stopPolling();
    isPollingRef.current = true;
    let attempts = 0;
    const maxAttempts = 25; // ~75-80 seconds total

    async function pollStep() {
      if (!isPollingRef.current || !isMountedRef.current) return;
      attempts++;
      setPollAttempt(attempts);

      try {
        const res = await apiClient.get(`/votes/status/${encodeURIComponent(reference)}`);
        if (!isPollingRef.current || !isMountedRef.current) return;

        const { status, isComplete, points, refNo, message } = res.data || {};

        if (status === 'completed' || isComplete) {
          stopPolling();
          setCompletedData({ points: points || currentVotes, refNo });
          setStep('success');

          // Notify parent component to update leaderboard points immediately
          const resultPayload = {
            nominee_id: nominee.id,
            category_id: nominee.category_id,
            points: points || currentVotes,
            refNo,
          };
          if (onSuccess) onSuccess(resultPayload);
          else if (onVote) onVote(resultPayload);
          return;
        }

        if (['failed', 'cancelled', 'expired'].includes(status)) {
          stopPolling();
          setError(message || `Payment was ${status}. Please try again.`);
          setStep('failed');
          return;
        }
      } catch (pollErr) {
        // Keep polling across transient network interruptions
      }

      if (attempts >= maxAttempts) {
        stopPolling();
        if (isMountedRef.current) {
          setError('Payment confirmation timed out. If you entered your PIN, your vote will be credited automatically once confirmed.');
          setStep('failed');
        }
        return;
      }

      // Schedule next check only after current check has completely resolved
      if (isPollingRef.current && isMountedRef.current) {
        pollTimerRef.current = setTimeout(pollStep, 3000);
      }
    }

    // First check after 2 seconds
    pollTimerRef.current = setTimeout(pollStep, 2000);
  }

  function handleReset() {
    stopPolling();
    setError('');
    setStep('select');
  }

  return (
    <div
      className="modal-overlay"
      onClick={step === 'waiting' ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Vote modal"
    >
      <div className="modal voter-card-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="voter-modal-header">
          <div className="voter-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/dekutso-logo.png" alt="DeKUTSO" style={{ height: '22px', width: 'auto', objectFit: 'contain' }} />
            <span>Cast Your Vote</span>
          </div>
          {step !== 'waiting' && (
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          )}
        </div>

        {/* STEP 1: Select Votes & Enter Phone */}
        {step === 'select' && (
          <form onSubmit={handleInitiate}>
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

              {/* Vote Selection Options */}
              <div className="voter-choice-section">
                <label className="voter-section-label">Select Vote Package</label>
                <div className="voter-options-grid">
                  {VOTE_OPTIONS.map((opt) => {
                    const isSelected = !isCustom && selectedVotes === opt.votes;
                    return (
                      <button
                        key={opt.votes}
                        type="button"
                        className={`voter-pill-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectOption(opt.votes)}
                      >
                        <span className="voter-pill-label">{opt.label}</span>
                        <span className="voter-pill-pts">{opt.points} pts (KES {opt.amount})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Votes Option */}
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    placeholder="Or enter custom votes (min 10)..."
                    value={customVotes}
                    onChange={handleCustomChange}
                    className="form-control"
                    style={{ fontSize: '0.88rem', padding: '8px 12px' }}
                  />
                  {isCustom && customVotes && (
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      = KES {customVotes} ({parseInt(customVotes, 10) >= 100 ? Math.floor(parseInt(customVotes, 10) * 1.1) : customVotes} pts)
                    </span>
                  )}
                </div>
              </div>

              {/* M-Pesa Phone Number Input */}
              <div className="form-group" style={{ marginTop: 'var(--space-md)', marginBottom: 0 }}>
                <label htmlFor="voter_phone" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 600 }}>
                  <Smartphone size={16} style={{ color: '#22c55e' }} />
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  id="voter_phone"
                  className="form-control"
                  placeholder="e.g. 0712345678 or 0112345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                  A prompt will appear on this phone to enter your M-Pesa PIN.
                </span>
              </div>

              {error && <p className="form-error" style={{ marginTop: 'var(--space-md)' }}>{error}</p>}
            </div>

            {/* Modal Actions */}
            <div className="modal-footer voter-modal-footer">
              <button
                type="submit"
                className="btn btn-gold btn-lg voter-confirm-btn"
                id="vote-submit-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <CheckCircle2 size={18} /> Pay KES {currentAmount} & Cast {currentVotes} {currentVotes === 1 ? 'Vote' : 'Votes'}
              </button>
              <p className="voter-ballot-notice" style={{ marginTop: '8px' }}>
                Secure M-Pesa Checkout • Official DeKUTSO Comrade Choice Award 2026
              </p>
            </div>
          </form>
        )}

        {/* STEP 2: Initiating */}
        {step === 'initiating' && (
          <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Loader2 size={44} className="spin-icon" style={{ color: 'var(--color-accent)', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Connecting to M-Pesa...</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Sending payment request of <strong>KES {currentAmount}</strong> to <strong>{phone}</strong>.
            </p>
          </div>
        )}

        {/* STEP 3: Waiting for PIN on Phone */}
        {step === 'waiting' && (
          <div className="modal-body" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '2px solid #22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: '#22c55e'
            }}>
              <Smartphone size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--color-text)' }}>
              Check Your Phone!
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '20px' }}>
              An M-Pesa prompt has been sent to <strong style={{ color: 'var(--color-text)' }}>{phone}</strong>.<br />
              Enter your M-Pesa PIN to complete payment of <strong style={{ color: '#22c55e' }}>KES {currentAmount}</strong>.
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              fontSize: '0.82rem',
              color: 'var(--color-text-muted)',
              marginBottom: '24px'
            }}>
              <Loader2 size={15} className="spin-icon" />
              Waiting for PIN confirmation ({pollAttempt}/25)...
            </div>

            <div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleReset}
                style={{ fontSize: '0.82rem' }}
              >
                Change Phone / Cancel
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success Celebration */}
        {step === 'success' && (
          <div className="modal-body" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: '#22c55e'
            }}>
              <CheckCircle2 size={40} />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
              <Sparkles size={16} /> VOTE CONFIRMED
            </div>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>
              Thank You for Voting!
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '16px' }}>
              <strong style={{ color: 'var(--color-text)' }}>{completedData?.points || currentVotes} points</strong> have been credited to <strong style={{ color: 'var(--color-text)' }}>{nominee.name}</strong>.
            </p>

            {completedData?.refNo && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.8rem',
                color: 'var(--color-text-muted)',
                marginBottom: '20px'
              }}>
                Receipt Code: <strong style={{ color: 'var(--color-text)', letterSpacing: '0.5px' }}>{completedData.refNo}</strong>
              </div>
            )}

            <button
              type="button"
              className="btn btn-gold btn-lg"
              onClick={onClose}
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        )}

        {/* STEP 5: Failed State */}
        {step === 'failed' && (
          <div className="modal-body" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '2px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ef4444'
            }}>
              <AlertCircle size={32} />
            </div>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#ef4444' }}>
              Payment Not Completed
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
              {error || 'The transaction could not be completed.'}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                style={{ flex: 1 }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-gold"
                onClick={handleReset}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
