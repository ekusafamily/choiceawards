import { useState, useEffect } from 'react';
import {
  X, Mail, Send, Copy, Check, MessageSquare,
  User, CheckCircle2, ExternalLink, Loader2, Sparkles, MessageCircle
} from 'lucide-react';
import apiClient from '../api/client';

export const OFFICIAL_EMAIL = 'dekutsochoiceawards@proton.me';

// Global helper to open the Contact Drawer from any component or link
export function openContactDrawer() {
  window.dispatchEvent(new CustomEvent('open-contact-drawer'));
}

export default function ContactDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('message'); // 'message' | 'email'

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    function handleOpen() {
      setIsOpen(true);
      setErrorMsg('');
      setSuccessMsg('');
    }
    window.addEventListener('open-contact-drawer', handleOpen);
    return () => window.removeEventListener('open-contact-drawer', handleOpen);
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!formData.contact.trim()) {
      setErrorMsg('Please provide your email address or phone number.');
      return;
    }
    if (!formData.message.trim()) {
      setErrorMsg('Please type your message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/contact', {
        name: formData.name.trim(),
        contact: formData.contact.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Message sent successfully! The committee will review it.');
        setFormData({
          name: '',
          contact: '',
          subject: 'General Inquiry',
          message: '',
        });
      } else {
        setErrorMsg('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      setErrorMsg(
        err.response?.data?.error?.message ||
        'Network error. Please try again or reach out via direct email.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyEmail() {
    navigator.clipboard.writeText(OFFICIAL_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  }

  if (!isOpen) return null;

  return (
    <div className="contact-drawer-overlay" onClick={() => setIsOpen(false)}>
      <aside
        className="contact-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Contact Us Drawer"
        onClick={(e) => e.stopPropagation()}
        id="contact-drawer"
      >
        {/* Drawer Header */}
        <div className="contact-drawer-header">
          <div className="contact-drawer-header-info">
            <span className="contact-drawer-pill">
              <Sparkles size={13} /> DeKUTSO Support
            </span>
            <h3>Get in Touch</h3>
            <p>We are here to assist with nominations, awards inquiries, and partnerships.</p>
          </div>
          <button
            type="button"
            className="contact-drawer-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close contact drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Option Tabs */}
        <div className="contact-drawer-tabs">
          <button
            type="button"
            className={`contact-tab-btn ${activeTab === 'message' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('message');
              setErrorMsg('');
            }}
          >
            <MessageSquare size={16} />
            <span>Send Message</span>
          </button>
          <button
            type="button"
            className={`contact-tab-btn ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('email');
              setErrorMsg('');
            }}
          >
            <Mail size={16} />
            <span>Direct Email</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="contact-drawer-body">
          {/* TAB 1: Messaging Sidebar (Saved to Database & Admin Portal) */}
          {activeTab === 'message' && (
            <div className="contact-form-wrap">
              {successMsg ? (
                <div className="contact-success-card">
                  <CheckCircle2 size={42} className="contact-success-icon" />
                  <h4>Message Delivered</h4>
                  <p>{successMsg}</p>
                  <p className="contact-success-sub">
                    A committee representative will review your inquiry shortly.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setSuccessMsg('')}
                    style={{ marginTop: 'var(--space-md)' }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  {errorMsg && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>
                      {errorMsg}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="contact-name">
                      Full Name <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <div className="input-with-icon">
                      <User size={16} className="input-icon" />
                      <input
                        id="contact-name"
                        type="text"
                        className="form-control with-icon-input"
                        placeholder="e.g. Kelvin Kimathi"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-info">
                      Email or Phone Number <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input
                        id="contact-info"
                        type="text"
                        className="form-control with-icon-input"
                        placeholder="e.g. comrade@dkut.ac.ke or 07XXXXXXXX"
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        required
                        disabled={submitting}
                      />
                    </div>
                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                      We will use this to contact you back.
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-subject">Inquiry Subject</label>
                    <select
                      id="contact-subject"
                      className="form-control"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      disabled={submitting}
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Nomination Submission">Nomination Submission</option>
                      <option value="Candidate Verification">Candidate Verification</option>
                      <option value="Sponsorship & Partnership">Sponsorship & Partnership</option>
                      <option value="Technical Issue / Bug">Technical Issue / Bug</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="contact-message">
                      Message <span style={{ color: 'var(--color-error)' }}>*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      className="form-control"
                      placeholder="Type your message, question, or feedback here..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-gold btn-block contact-submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="spinner-icon animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Message to Committee</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Direct Email Support */}
          {activeTab === 'email' && (
            <div className="contact-email-wrap">
              <div className="contact-email-card">
                <div className="contact-email-badge">
                  <Mail size={28} className="contact-email-icon" />
                </div>
                <h4>Official Awards Email</h4>
                <p>
                  For formal correspondence, official documentation, press inquiries, or committee escalation:
                </p>

                <div className="contact-email-box">
                  <span className="contact-email-text">{OFFICIAL_EMAIL}</span>
                </div>

                <div className="contact-email-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm contact-copy-btn"
                    onClick={handleCopyEmail}
                  >
                    {copiedEmail ? <Check size={15} color="#22c55e" /> : <Copy size={15} />}
                    <span>{copiedEmail ? 'Copied to Clipboard!' : 'Copy Email Address'}</span>
                  </button>

                  <a
                    href={`mailto:${OFFICIAL_EMAIL}?subject=${encodeURIComponent('Inquiry - DeKUTSO Comrade Choice Awards 2026')}`}
                    className="btn btn-gold btn-sm contact-mailto-btn"
                  >
                    <ExternalLink size={15} />
                    <span>Open Mail Client</span>
                  </a>
                </div>
              </div>

              <div className="contact-info-callout">
                <h5>DeKUTSO Awards Secretariat</h5>
                <p>Dedan Kimathi University of Technology (DeKUT), Nyeri</p>
                <p>Support response window: Mon – Sat (9:00 AM – 6:00 PM EAT)</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
