import { useState, useEffect, useRef } from 'react';
import {
  X, Trophy, User, CheckCircle2, Smartphone, Loader2,
  AlertCircle, RefreshCw, ShieldCheck, Sparkles, Flame,
  Mail, Lock
} from 'lucide-react';
import apiClient from '../api/client';

const BALLOT_AMOUNT = 10; // Fixed KSh 10 per category
const BALLOT_POINTS = 10; // Fixed 10 points per vote

const COMRADE_TRIVIA = [
  {
    icon: '🏆',
    title: 'One Student, One Vote',
    text: 'Every student gets 1 vote per category. This guarantees fair representation for every nominee.',
  },
  {
    icon: '☕',
    title: 'DeKUT Comrade Lore',
    text: 'Late-night coffee and revision sessions fuel great ideas and innovation across campus.',
  },
  {
    icon: '🎓',
    title: 'Silicon Savannah',
    text: 'DeKUT is renowned for excellence in technology, engineering, and student innovation.',
  },
  {
    icon: '🌟',
    title: 'Celebrate Excellence',
    text: 'Recognizing outstanding student leaders and talents shaping the DeKUT community.',
  },
];

function getInitiationStage(seconds, nomineeName) {
  const firstName = nomineeName?.split(' ')[0] || 'Nominee';
  if (seconds < 5) {
    return {
      title: 'Connecting...',
      sub: `Preparing ballot for ${firstName}`,
      progress: Math.min(30, 10 + seconds * 4),
    };
  } else if (seconds < 12) {
    return {
      title: `Processing vote for ${firstName}...`,
      sub: 'Please wait a moment',
      progress: Math.min(65, 30 + (seconds - 5) * 5),
    };
  } else if (seconds < 18) {
    return {
      title: 'Almost ready...',
      sub: 'Sending prompt to your phone',
      progress: Math.min(90, 65 + (seconds - 12) * 4),
    };
  } else {
    return {
      title: 'Finalizing...',
      sub: 'Please check your phone in a moment',
      progress: Math.min(96, 90 + (seconds - 18) * 0.5),
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

/**
 * Validate DeKUT Student Institutional Email format:
 * xxxxxxx.xxxxxxRR@students.ac.ke where RR is admission year (20 to 26)
 */
function validateStudentEmail(em) {
  if (!em) return 'Please enter your DeKUT student email.';
  const cleaned = em.trim().toLowerCase();
  if (!cleaned.endsWith('@students.ac.ke') && !cleaned.endsWith('@students.dekut.ac.ke')) {
    return 'Domain must be @students.ac.ke (e.g. name.admission22@students.ac.ke).';
  }
  const username = cleaned.split('@')[0];
  const regex = /^[a-z0-9]+(?:\.[a-z0-9]+)*\.?(2[0-6])$/i;
  if (!regex.test(username)) {
    return 'Format must be firstname.lastnameRR@students.ac.ke with admission year between 20 and 26 (e.g. 21, 22, 23).';
  }
  return null;
}

export default function VoteModal({ nominee, onClose, onVote, onSuccess }) {
  // Voter credentials state
  const [email, setEmail] = useState(() => localStorage.getItem('cca_voter_email') || '');
  const [phone, setPhone] = useState(() => localStorage.getItem('cca_voter_phone') || '');
  const [emailTouched, setEmailTouched] = useState(false);

  // Duplicate category vote enforcement
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [alreadyVotedMessage, setAlreadyVotedMessage] = useState('');

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

  // Check eligibility whenever email changes (debounced)
  useEffect(() => {
    if (!email || !nominee?.category_id) {
      setAlreadyVoted(false);
      setAlreadyVotedMessage('');
      return;
    }

    const emailErr = validateStudentEmail(email);
    if (emailErr) {
      setAlreadyVoted(false);
      setAlreadyVotedMessage('');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingEligibility(true);
        const res = await apiClient.get('/votes/check-eligibility', {
          params: {
            email: email.trim().toLowerCase(),
            category_id: nominee.category_id,
          },
        });

        if (res.data?.hasVoted) {
          setAlreadyVoted(true);
          setAlreadyVotedMessage(
            res.data.message || 'You have already voted in this category!'
          );
        } else {
          setAlreadyVoted(false);
          setAlreadyVotedMessage('');
        }
      } catch (err) {
        // If server returns 400 with hasVoted flag
        if (err.response?.data?.hasVoted) {
          setAlreadyVoted(true);
          setAlreadyVotedMessage(err.response.data.message);
        }
      } finally {
        setCheckingEligibility(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [email, nominee?.category_id]);

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

  const nomineeFirstName = nominee?.name?.split(' ')[0] || 'Nominee';
  const categoryName = nominee.categories?.name || nominee.category_name || 'this category';

  const currentStage = getInitiationStage(
    elapsedSecs,
    nominee?.name || 'Nominee'
  );
  const currentTrivia = COMRADE_TRIVIA[triviaIdx % COMRADE_TRIVIA.length];

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

    const emailError = validateStudentEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (alreadyVoted) {
      setError('You have already voted in this category! Each student can only vote once per category.');
      return;
    }

    // Save credentials for voter convenience across categories
    localStorage.setItem('cca_voter_email', email.trim().toLowerCase());
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
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          amount: BALLOT_AMOUNT,
          votes_count: 1,
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
          setCompletedData({ points: points || BALLOT_POINTS, refNo });
          setStep('success');

          // Notify parent component to update leaderboard points immediately
          const resultPayload = {
            nominee_id: nominee.id,
            category_id: nominee.category_id,
            points: points || BALLOT_POINTS,
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

  const emailFormatError = emailTouched ? validateStudentEmail(email) : null;
  const isEmailValid = email && !validateStudentEmail(email);

  return (
    <div className="modal-overlay animate-fade-in" onClick={handleCloseModal}>
      <div
        className="modal-container voter-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '500px',
          width: '94%',
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(212, 160, 23, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100dvh - 32px)',
        }}
      >
        {/* Modal Header */}
        <div className="modal-header voter-modal-header" style={{ background: '#FAF9F6' }}>
          <div className="voter-modal-badge">
            <Trophy size={14} className="text-gold" />
            <span>OFFICIAL BALLOT</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleCloseModal}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: Ballot Selection & Email Verification */}
        {step === 'select' && (
          <form onSubmit={handleInitiate} style={{ background: '#FFFFFF' }}>
            <div className="modal-body voter-modal-body" style={{ background: '#FFFFFF', padding: '18px 20px' }}>
              {/* Nominee Profile Snapshot */}
              <div
                className="voter-nominee-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 14px',
                  background: '#FAF9F6',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: '12px',
                  marginBottom: '14px',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div className="voter-nominee-avatar">
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
                    {categoryName}
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

              {/* Fixed 1 Vote Ballot Policy Card (Solid background, never transparent) */}
              <div
                className="voter-ballot-card"
                style={{
                  background: '#FFFDF0',
                  border: '2px solid var(--color-accent)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginTop: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 4px 14px rgba(212, 160, 23, 0.12)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <ShieldCheck size={14} /> One Student, One Vote Policy
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                    1 Ballot (10 Points)
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Fair Play: 1 vote per student per category
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--color-accent)' }}>
                    KES {BALLOT_AMOUNT}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>
                    Official Fee
                  </span>
                </div>
              </div>

              {/* Already Voted in this Category Banner */}
              {alreadyVoted ? (
                <div style={{
                  background: '#FFFBEB',
                  border: '1.5px solid #F59E0B',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  marginTop: '16px',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.1)',
                }}>
                  <div style={{ color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700, fontSize: '0.98rem', marginBottom: '8px' }}>
                    <Lock size={18} /> Category Vote Already Cast
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--color-text)', lineHeight: 1.5, margin: '0 0 14px' }}>
                    {alreadyVotedMessage || `You have already cast your vote in the "${categoryName}" category! To ensure fairness, each student can only vote once per category.`}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600, margin: '0 0 14px' }}>
                    💡 You are still eligible to vote in other award categories!
                  </p>
                  <button
                    type="button"
                    className="btn btn-gold btn-md"
                    onClick={onClose}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    Explore Other Categories
                  </button>
                </div>
              ) : (
                <>
                  {/* Student Institutional Email Input */}
                  <div className="form-group" style={{ marginTop: '16px', marginBottom: '14px' }}>
                    <label htmlFor="voter_email" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 600 }}>
                      <Mail size={16} style={{ color: 'var(--color-accent)' }} />
                      DeKUT Student Email
                      {checkingEligibility && (
                        <Loader2 size={12} className="spin-icon" style={{ marginLeft: 'auto', color: 'var(--color-accent)' }} />
                      )}
                      {isEmailValid && !checkingEligibility && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <CheckCircle2 size={12} /> Eligible
                        </span>
                      )}
                    </label>
                    <input
                      type="email"
                      id="voter_email"
                      className={`form-control ${emailFormatError ? 'is-invalid' : ''}`}
                      placeholder="e.g. john.doe22@students.ac.ke"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      onBlur={() => setEmailTouched(true)}
                      autoComplete="email"
                      required
                      style={{ fontSize: '0.88rem' }}
                    />
                    <span style={{ fontSize: '0.74rem', color: emailFormatError ? '#ef4444' : 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                      {emailFormatError || 'Format: firstname.lastnameRR@students.ac.ke (Admission year RR: 20–26)'}
                    </span>
                  </div>

                  {/* M-Pesa Phone Number Input */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
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
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setError('');
                      }}
                      autoComplete="tel"
                      required
                      style={{ fontSize: '0.88rem' }}
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                      An M-Pesa prompt for KSh 10 will be sent to this phone.
                    </span>
                  </div>

                  {error && <p className="form-error" style={{ marginTop: '14px' }}>{error}</p>}
                </>
              )}
            </div>

            {/* Modal Actions */}
            {!alreadyVoted && (
              <div className="modal-footer voter-modal-footer">
                <button
                  type="submit"
                  className="btn btn-gold btn-lg voter-confirm-btn"
                  id="vote-submit-btn"
                  disabled={checkingEligibility || alreadyVoted}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <CheckCircle2 size={18} /> Pay KES {BALLOT_AMOUNT} & Cast Ballot
                </button>
                <p className="voter-ballot-notice" style={{ marginTop: '8px' }}>
                  Secure PayHero M-Pesa • 1 Vote per Category per Student
                </p>
              </div>
            )}
          </form>
        )}

        {/* STEP 2: Plain & Engaging Waiting View */}
        {step === 'initiating' && (
          <div className="stk-engaging-view" style={{ padding: '24px 20px 20px', background: '#FFFFFF' }}>
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

            {/* Plain Status Header */}
            <div style={{ marginBottom: '16px' }}>
              <Loader2 size={36} className="spin-icon" style={{ color: 'var(--color-accent)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px', color: 'var(--color-secondary)' }}>
                {currentStage.title}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
                {currentStage.sub}
              </p>

              <div className="stk-progress-container" style={{ maxWidth: '280px', margin: '14px auto 0' }}>
                <div
                  className="stk-progress-bar"
                  style={{ width: `${currentStage.progress}%` }}
                />
              </div>
            </div>

            {/* Interactive Hype Button */}
            <div className="stk-hype-section" style={{ margin: '20px 0 16px' }}>
              <button
                type="button"
                className="btn btn-gold btn-sm stk-cheer-btn"
                onClick={handleCheer}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  padding: '7px 18px',
                }}
              >
                <Flame size={16} /> Tap to Cheer {nomineeFirstName}!
              </button>
              <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--color-accent)' }}>
                {getCheerMessage(cheerCount, nomineeFirstName)}
              </div>
            </div>

            {/* Fun Comrade Lore / Trivia Cards */}
            <div className="stk-trivia-card" style={{ maxWidth: '380px', margin: '0 auto 18px' }}>
              <span className="stk-trivia-icon">{currentTrivia.icon}</span>
              <div className="stk-trivia-content">
                <div className="stk-trivia-title">{currentTrivia.title}</div>
                <div className="stk-trivia-text">{currentTrivia.text}</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleCancelInitiation}
                style={{ fontSize: '0.82rem' }}
              >
                Cancel Initiation
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Active STK Prompt Waiting on Phone */}
        {step === 'waiting' && (
          <div className="modal-body" style={{ textAlign: 'center', padding: '36px 20px', background: '#FFFFFF' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--color-accent)'
            }}>
              <Smartphone size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
              Check Your Phone!
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
              An M-Pesa STK prompt for <strong style={{ color: 'var(--color-accent)' }}>KES {BALLOT_AMOUNT}</strong> has been sent to <strong style={{ color: 'var(--color-text)' }}>{phone}</strong>.<br />
              Enter your M-Pesa PIN to submit your ballot.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              color: 'var(--color-text-muted)',
              fontSize: '0.85rem',
              marginBottom: '24px'
            }}>
              <Loader2 size={16} className="spin-icon" style={{ color: 'var(--color-accent)' }} />
              <span>Verifying payment... (Attempt {pollAttempt})</span>
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
          <div className="modal-body" style={{ textAlign: 'center', padding: '36px 20px', background: '#FFFFFF' }}>
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
              <Sparkles size={16} /> BALLOT CONFIRMED
            </div>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>
              Thank You for Voting!
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '14px' }}>
              <strong style={{ color: 'var(--color-text)' }}>{completedData?.points || BALLOT_POINTS} points</strong> have been credited to <strong style={{ color: 'var(--color-text)' }}>{nominee.name}</strong>.
            </p>

            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.84rem',
              color: 'var(--color-text)',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              🔒 <strong>Category Locked:</strong> Your vote in <em>{categoryName}</em> has been securely recorded for <strong>{email}</strong>. You are still eligible to vote in other categories!
            </div>

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
              Vote in Other Categories
            </button>
          </div>
        )}

        {/* STEP 5: Failed State */}
        {step === 'failed' && (
          <div className="modal-body" style={{ textAlign: 'center', padding: '36px 20px', background: '#FFFFFF' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--color-danger)'
            }}>
              <AlertCircle size={32} />
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
              Vote Not Completed
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
              {error || 'The payment was cancelled or timed out. No funds were deducted.'}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCloseModal}
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
