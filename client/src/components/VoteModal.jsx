import { useState, useEffect, useRef } from 'react';
import {
  X, Trophy, User, CheckCircle2, Smartphone, Loader2,
  AlertCircle, RefreshCw, ShieldCheck, Sparkles, Flame
} from 'lucide-react';
import apiClient from '../api/client';

const VOTE_OPTIONS = [
  { votes: 10, amount: 10, points: 10, label: '10 Votes' },
  { votes: 20, amount: 20, points: 20, label: '20 Votes' },
  { votes: 50, amount: 50, points: 50, label: '50 Votes' },
  // { votes: 100, amount: 100, points: 110, label: '100 Votes (+10% Bonus)' },
];

const COMRADE_TRIVIA = [
  {
    icon: '🏆',
    title: 'Every Single Vote Counts!',
    text: 'Top categories in the Comrade Choice Awards 2026 are separated by single-digit points. Your support makes all the difference!',
  },
  {
    icon: '📱',
    title: 'Keep Your Phone Screen Unlocked',
    text: 'Safaricom M-Pesa is preparing your STK PIN prompt. It will pop up right on your phone in a few seconds.',
  },
  {
    icon: '☕',
    title: 'DeKUT Comrade Lore',
    text: 'Over 2,500 cups of tea and coffee fuel late-night revision sessions and tech hackathons at Dedan Kimathi each week!',
  },
  {
    icon: '🎓',
    title: 'Silicon Savannah of Mt. Kenya',
    text: 'DeKUT leads in robotics, engineering, and student innovation across East Africa. Celebrate comrade excellence!',
  },
  {
    icon: '⚡',
    title: 'Speedy PIN Entry',
    text: 'The fastest STK PIN entered this week took just 2.4 seconds! Can you beat the record when your prompt pops up?',
  },
  {
    icon: '🛡️',
    title: 'Direct Safaricom Verification',
    text: 'All transactions are verified directly via Safaricom M-Pesa. Votes are credited immediately to the official leaderboard.',
  },
];

function getInitiationStage(seconds, nomineeName, phone, currentVotes, currentAmount) {
  const firstName = nomineeName?.split(' ')[0] || 'Nominee';
  if (seconds < 4) {
    return {
      stepNum: 1,
      title: 'Connecting to Safaricom Daraja...',
      sub: 'Establishing 256-bit encrypted M-Pesa handshake',
      progress: Math.min(25, 10 + seconds * 4),
    };
  } else if (seconds < 9) {
    return {
      stepNum: 2,
      title: `Preparing ballot for ${firstName}...`,
      sub: `Allocating ${currentVotes} ${currentVotes === 1 ? 'vote' : 'votes'} (KES ${currentAmount})`,
      progress: Math.min(50, 25 + (seconds - 4) * 5),
    };
  } else if (seconds < 14) {
    return {
      stepNum: 3,
      title: 'Authorizing PayNexus M-Pesa Gateway...',
      sub: 'Negotiating secure STK push merchant token',
      progress: Math.min(75, 50 + (seconds - 9) * 5),
    };
  } else if (seconds < 18) {
    return {
      stepNum: 4,
      title: `Dispatching PIN prompt to ${phone}...`,
      sub: 'Waking up M-Pesa SIM prompt on your phone',
      progress: Math.min(92, 75 + (seconds - 14) * 4),
    };
  } else {
    return {
      stepNum: 4,
      title: 'Almost ready! Unlock your phone now...',
      sub: 'Safaricom is delivering the PIN dialog to your screen',
      progress: Math.min(96, 92 + (seconds - 18) * 0.5),
    };
  }
}

function getCheerMessage(count, nomineeFirstName) {
  if (count === 0) return `Tap to send hype to ${nomineeFirstName} while connecting!`;
  if (count < 5) return `⚡ ${count} ${count === 1 ? 'cheer' : 'cheers'} sent! Keep tapping!`;
  if (count < 12) return `🔥 ${count} cheers! The hype is real!`;
  if (count < 25) return `🏆 ${count} cheers! Super Comrade Fan energy!`;
  return `🌟 ${count} cheers! Legendary Comrade Backer!`;
}

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

  // Creative STK engagement state
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [cheerCount, setCheerCount] = useState(0);
  const [cheerParticles, setCheerParticles] = useState([]);
  const [triviaIdx, setTriviaIdx] = useState(0);

  const pollTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const isPollingRef = useRef(false);
  const abortControllerRef = useRef(null);

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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Timer & trivia cycle for creative STK push initiating state
  useEffect(() => {
    if (step !== 'initiating') {
      setElapsedSecs(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSecs((prev) => {
        const next = prev + 1;
        if (next % 4 === 0) {
          setTriviaIdx((idx) => (idx + 1) % COMRADE_TRIVIA.length);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // Compute final votes and amount (1 vote = 1 KES, minimum 10 KES)
  const currentVotes = isCustom
    ? Math.max(10, parseInt(customVotes, 10) || 10)
    : selectedVotes;
  const currentAmount = currentVotes; // 1 bob per vote
  const nomineeFirstName = nominee?.name?.split(' ')[0] || 'Nominee';

  const currentStage = getInitiationStage(
    elapsedSecs,
    nominee?.name || 'Nominee',
    phone,
    currentVotes,
    currentAmount
  );
  const currentTrivia = COMRADE_TRIVIA[triviaIdx % COMRADE_TRIVIA.length];

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

  // Interactive cheer reactions
  function handleCheer() {
    setCheerCount((c) => c + 1);
    const emojis = ['🔥', '🏆', '💚', '⚡', '🎉', '🌟', '👏', '🎯'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const id = Date.now() + Math.random();
    const x = Math.floor(25 + Math.random() * 50); // 25% to 75%
    setCheerParticles((prev) => [...prev.slice(-10), { id, emoji, x }]);

    setTimeout(() => {
      setCheerParticles((prev) => prev.filter((p) => p.id !== id));
    }, 1300);
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

  // Cancel in-flight STK initiation
  function handleCancelInitiation() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStep('select');
    setError('');
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

    setElapsedSecs(0);
    setStep('initiating');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await apiClient.post(
        '/votes/initiate',
        {
          nominee_id: nominee.id,
          category_id: nominee.category_id,
          amount: currentAmount,
          phone: phone.trim(),
          votes_count: currentVotes,
          nominee_name: nominee.name,
        },
        {
          signal: controller.signal,
        }
      );

      if (res.data?.success && res.data.reference) {
        setActiveReference(res.data.reference);
        setStep('waiting');
        startPolling(res.data.reference);
      } else {
        throw new Error(res.data?.error?.message || 'Failed to dispatch M-Pesa push.');
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      console.error('STK push error:', err);
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to start payment. Please check your network and phone number.'
      );
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

  function handleCloseModal() {
    if (step === 'initiating') {
      handleCancelInitiation();
    }
    stopPolling();
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      onClick={step === 'waiting' ? undefined : handleCloseModal}
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
            <button className="modal-close" onClick={handleCloseModal} aria-label="Close">
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

        {/* STEP 2: Creative & Engaging STK Push Initiating */}
        {step === 'initiating' && (
          <div className="stk-engaging-view">
            {/* Floating cheer particles */}
            <div className="stk-floating-area">
              {cheerParticles.map((particle) => (
                <span
                  key={particle.id}
                  className="stk-floating-emoji"
                  style={{ left: `${particle.x}%` }}
                >
                  {particle.emoji}
                </span>
              ))}
            </div>

            {/* Live Status Header */}
            <div className="stk-init-status-box">
              <div className="stk-live-badge">
                <span className="stk-pulse-dot" />
                Live Safaricom Gateway Link
              </div>
              <h3 className="stk-stage-title">
                {currentStage.title}
              </h3>
              <p className="stk-stage-sub">
                {currentStage.sub}
              </p>

              <div className="stk-progress-container">
                <div
                  className="stk-progress-bar"
                  style={{ width: `${currentStage.progress}%` }}
                />
              </div>
              <div className="stk-progress-meta">
                <span>Stage {currentStage.stepNum} of 4</span>
                <span>~{Math.round(currentStage.progress)}%</span>
              </div>
            </div>

            {/* Simulated Phone Prompt Mockup */}
            <div className="stk-phone-mockup">
              <div className="stk-phone-header">
                <span className="stk-phone-title">
                  <Smartphone size={13} /> M-Pesa STK Prompt
                </span>
                <span className="stk-phone-time">Incoming...</span>
              </div>
              <p className="stk-phone-body">
                Do you want to pay <strong>KES {currentAmount}</strong> to{' '}
                <strong>Comrade Choice Awards</strong> for{' '}
                <strong>{nomineeFirstName}</strong>?
              </p>
              <div className="stk-phone-prompt-box">
                <span className="stk-phone-prompt-text">
                  Enter M-Pesa PIN:
                </span>
                <div className="stk-pin-dots">
                  <span className="stk-pin-dot" />
                  <span className="stk-pin-dot" />
                  <span className="stk-pin-dot" />
                  <span className="stk-pin-dot" />
                </div>
              </div>
            </div>

            {/* Interactive Hype Button */}
            <div className="stk-hype-section">
              <button
                type="button"
                className="stk-hype-btn"
                onClick={handleCheer}
                id="cheer-hype-btn"
              >
                <Flame size={18} style={{ color: '#f59e0b' }} />
                Tap to Hype {nomineeFirstName}!
              </button>
              <p className="stk-hype-status">
                {getCheerMessage(cheerCount, nomineeFirstName)}
              </p>
            </div>

            {/* Comrade Trivia & Tips Carousel */}
            <div className="stk-trivia-card">
              <span className="stk-trivia-icon">{currentTrivia.icon}</span>
              <div className="stk-trivia-content">
                <strong>{currentTrivia.title}</strong>
                <span>{currentTrivia.text}</span>
              </div>
            </div>

            {/* Footer reassurance & cancel */}
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="stk-cancel-link"
                onClick={handleCancelInitiation}
              >
                Wrong phone number? Cancel & edit
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Waiting for PIN on Phone */}
        {step === 'waiting' && (
          <div className="modal-body" style={{ textAlign: 'center', padding: '32px 20px 24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '2px solid #22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#22c55e'
            }}>
              <Smartphone size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--color-text)' }}>
              Check Your Phone!
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '14px' }}>
              An M-Pesa prompt has been sent to <strong style={{ color: 'var(--color-text)' }}>{phone}</strong>.<br />
              Enter your M-Pesa PIN to complete payment of <strong style={{ color: '#22c55e' }}>KES {currentAmount}</strong>.
            </p>

            {cheerCount > 0 && (
              <div style={{
                fontSize: '0.82rem',
                color: 'var(--color-primary)',
                fontWeight: 600,
                marginBottom: '14px',
                background: 'rgba(27, 94, 32, 0.08)',
                padding: '6px 14px',
                borderRadius: '20px',
                display: 'inline-block'
              }}>
                🔥 You sent {cheerCount} {cheerCount === 1 ? 'cheer' : 'cheers'} to {nomineeFirstName}!
              </div>
            )}

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              fontSize: '0.82rem',
              color: 'var(--color-text-muted)',
              marginBottom: '20px'
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
