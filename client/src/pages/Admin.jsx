import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Lock, LogOut, Check, X, Trash2, Plus, User,
  Trophy, Users, Award, ExternalLink, AlertCircle, CheckCircle,
  Clock, Search, UploadCloud, Loader2
} from 'lucide-react';
import apiClient from '../api/client';
import CourseSelect from '../components/CourseSelect';
import CategorySelect from '../components/CategorySelect';
import YearSelect from '../components/YearSelect';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('cca_admin_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('nominations'); // 'nominations' | 'nominees' | 'categories'
  const [stats, setStats] = useState({ categoriesCount: 19, nomineesCount: 0, votesCount: 0, totalPoints: 0, pendingNominations: 0 });
  const [nominations, setNominations] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nominationFilter, setNominationFilter] = useState('pending');
  const [nomineeCategoryFilter, setNomineeCategoryFilter] = useState('');
  const [nomineeSearch, setNomineeSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: 'success' });

  // Add Nominee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNominee, setNewNominee] = useState({
    name: '',
    category_id: '',
    course: '',
    year_of_study: '3',
    photo_url: '',
    bio: '',
    achievements: '',
  });
  const [modalUploading, setModalUploading] = useState(false);
  const [modalImageError, setModalImageError] = useState('');
  const modalFileInputRef = useRef(null);

  // Check login
  async function handleLogin(e) {
    e.preventDefault();
    const enteredPasscode = passcode.trim();
    if (!enteredPasscode) return;

    setIsVerifying(true);
    setAuthError('');

    try {
      // Primary: Verify with backend API (reads ADMIN_PASSWORD dynamically from server .env)
      const res = await apiClient.post('/admin/login', { passcode: enteredPasscode });
      if (res.data?.success) {
        sessionStorage.setItem('cca_admin_auth', 'true');
        setIsAuthenticated(true);
        setAuthError('');
        return;
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setAuthError(err.response.data?.error?.message || 'Invalid administrator passcode. Please try again.');
        return;
      }

      // Offline / network fallback: Check against client .env variable if configured
      const clientEnvPasscode = import.meta.env.VITE_ADMIN_PASSCODE;
      if (clientEnvPasscode && enteredPasscode === clientEnvPasscode.trim()) {
        sessionStorage.setItem('cca_admin_auth', 'true');
        setIsAuthenticated(true);
        setAuthError('');
        return;
      }

      setAuthError(err.response?.data?.error?.message || 'Authentication error. Please check server connection.');
    } finally {
      setIsVerifying(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('cca_admin_auth');
    setIsAuthenticated(false);
    setPasscode('');
  }

  // Load admin data
  useEffect(() => {
    if (!isAuthenticated) return;
    loadDashboardData();
  }, [isAuthenticated]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [statsRes, nomsRes, nomineesRes, catsRes] = await Promise.all([
        apiClient.get('/stats').catch(() => ({ data: null })),
        apiClient.get('/nominations').catch(() => ({ data: [] })),
        apiClient.get('/nominees').catch(() => ({ data: [] })),
        apiClient.get('/categories').catch(() => ({ data: [] })),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (nomsRes.data) setNominations(nomsRes.data);
      if (nomineesRes.data) setNominees(nomineesRes.data);
      if (catsRes.data) {
        setCategories(catsRes.data);
        if (!newNominee.category_id && catsRes.data.length > 0) {
          setNewNominee((prev) => ({ ...prev, category_id: catsRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  function flashMessage(text, type = 'success') {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: '', type: 'success' }), 4000);
  }

  // Approve nomination
  async function handleApproveNomination(id) {
    try {
      const res = await apiClient.patch(`/nominations/${id}/approve`);
      if (res.data.success) {
        flashMessage('Nomination approved and published to official nominees list!');
        loadDashboardData();
      }
    } catch (err) {
      flashMessage('Failed to approve nomination.', 'error');
    }
  }

  // Reject nomination
  async function handleRejectNomination(id) {
    try {
      const res = await apiClient.patch(`/nominations/${id}/reject`);
      if (res.data.success) {
        flashMessage('Nomination has been marked as rejected.', 'info');
        loadDashboardData();
      }
    } catch (err) {
      flashMessage('Failed to reject nomination.', 'error');
    }
  }

  // Delete nomination
  async function handleDeleteNomination(id) {
    if (!window.confirm('Are you sure you want to permanently delete this nomination?')) return;
    try {
      await apiClient.delete(`/nominations/${id}`);
      flashMessage('Nomination deleted.');
      loadDashboardData();
    } catch (err) {
      flashMessage('Failed to delete nomination.', 'error');
    }
  }

  // Delete nominee
  async function handleDeleteNominee(id, name) {
    if (!window.confirm(`Are you sure you want to remove nominee "${name}"?`)) return;
    try {
      await apiClient.delete(`/nominees/${id}`);
      flashMessage(`Nominee "${name}" removed.`);
      loadDashboardData();
    } catch (err) {
      flashMessage('Failed to delete nominee.', 'error');
    }
  }

  // Upload image in Add Nominee Modal
  async function handleModalImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setModalImageError(`File is ${(file.size / 1024).toFixed(1)}KB. Max allowed is 500KB.`);
      return;
    }

    setModalImageError('');
    setModalUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url) {
        setNewNominee((prev) => ({ ...prev, photo_url: res.data.url }));
      }
    } catch (err) {
      setModalImageError('Failed to upload display image.');
    } finally {
      setModalUploading(false);
    }
  }

  // Submit Add Nominee Form
  async function handleAddNomineeSubmit(e) {
    e.preventDefault();
    if (!newNominee.name || !newNominee.category_id) {
      alert('Please provide name and category.');
      return;
    }

    try {
      await apiClient.post('/nominees', newNominee);
      flashMessage(`Nominee "${newNominee.name}" created successfully!`);
      setShowAddModal(false);
      setNewNominee({
        name: '',
        category_id: categories[0]?.id || '',
        course: '',
        year_of_study: '3',
        photo_url: '',
        bio: '',
        achievements: '',
      });
      loadDashboardData();
    } catch (err) {
      alert('Failed to add nominee.');
    }
  }

  // Filtered nominations
  const filteredNominations = nominations.filter((n) => {
    if (nominationFilter === 'all') return true;
    return n.status === nominationFilter;
  });

  // Filtered nominees
  const filteredNominees = nominees.filter((nom) => {
    const matchesCat = nomineeCategoryFilter ? nom.category_id === nomineeCategoryFilter : true;
    const matchesSearch = nomineeSearch
      ? nom.name.toLowerCase().includes(nomineeSearch.toLowerCase()) ||
        (nom.course && nom.course.toLowerCase().includes(nomineeSearch.toLowerCase()))
      : true;
    return matchesCat && matchesSearch;
  });

  // If not logged in, render passcode screen
  if (!isAuthenticated) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="admin-login-card">
          <div className="admin-login-icon">
            <ShieldCheck size={48} color="var(--color-primary)" />
          </div>
          <h2>DeKUTSO Admin Portal</h2>
          <hr className="gold-line" />
          <p className="admin-login-subtext">
            Comrade Choice Awards 2026 • Review nominations, manage nominees & oversee results.
          </p>

          <form onSubmit={handleLogin} style={{ marginTop: 'var(--space-lg)' }}>
            <div className="form-group">
              <label htmlFor="admin_passcode">
                <Lock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                Admin Passcode
              </label>
              <input
                type="password"
                id="admin_passcode"
                className="form-control"
                placeholder="Enter administrator passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={isVerifying}
                autoFocus
                required
              />
            </div>

            {authError && (
              <div className="form-error" style={{ marginBottom: 'var(--space-md)' }}>
                <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={16} className="spin-icon" /> Verifying Passcode...
                </>
              ) : (
                'Access Admin Dashboard'
              )}
            </button>
          </form>

          <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
            <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              ← Return to Comrade Choice Awards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = nominations.filter((n) => n.status === 'pending').length;

  return (
    <div className="admin-page page">
      <div className="container">
        {/* Admin Header */}
        <div className="admin-topbar">
          <div>
            <div className="admin-badge">
              <ShieldCheck size={16} /> Official DeKUTSO Administration
            </div>
            <h1>Awards Control Dashboard</h1>
            <p className="admin-subtitle">
              Manage student nominations, display photos, published nominees, and live voting tallies.
            </p>
          </div>

          <div className="admin-actions-right">
            <button className="btn btn-outline btn-sm" onClick={handleLogout} title="Sign out of admin">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Action Flash Alert */}
        {actionMessage.text && (
          <div className={`admin-alert ${actionMessage.type}`}>
            {actionMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Stats Row */}
        <div className="admin-stats-grid">
          <div className={`admin-stat-card ${pendingCount > 0 ? 'highlight-gold' : ''}`}>
            <div className="stat-card-label">Pending Nominations</div>
            <div className="stat-card-value">{pendingCount}</div>
            <div className="stat-card-foot">Awaiting review & approval</div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-card-label">Published Nominees</div>
            <div className="stat-card-value">{nominees.length}</div>
            <div className="stat-card-foot">Live for student voting</div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-card-label">Total Votes Cast</div>
            <div className="stat-card-value">{(stats.votesCount || 0).toLocaleString()}</div>
            <div className="stat-card-foot">Across all 19 categories</div>
          </div>

          <div className="admin-stat-card">
            <div className="stat-card-label">Total Points Tallied</div>
            <div className="stat-card-value gold-accent">{(stats.totalPoints || 0).toLocaleString()}</div>
            <div className="stat-card-foot">Vote points accumulated</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            className={`admin-tab-btn ${activeTab === 'nominations' ? 'active' : ''}`}
            onClick={() => setActiveTab('nominations')}
          >
            <Clock size={18} />
            Nominations Queue
            {pendingCount > 0 && <span className="tab-pill-badge">{pendingCount}</span>}
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'nominees' ? 'active' : ''}`}
            onClick={() => setActiveTab('nominees')}
          >
            <Users size={18} />
            Manage Nominees ({nominees.length})
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <Award size={18} />
            Categories ({categories.length})
          </button>
        </div>

        {/* TAB 1: Nominations Queue */}
        {activeTab === 'nominations' && (
          <div className="admin-content-card">
            <div className="admin-card-header">
              <div>
                <h2>Submitted Nominations</h2>
                <p>Review candidate details and display images submitted by DeKUT comrades.</p>
              </div>

              {/* Status Filter Pills */}
              <div className="filter-pills">
                {['pending', 'approved', 'rejected', 'all'].map((f) => (
                  <button
                    key={f}
                    className={`pill-btn ${nominationFilter === f ? 'active' : ''}`}
                    onClick={() => setNominationFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner">
                <div className="spinner" />
              </div>
            ) : filteredNominations.length === 0 ? (
              <div className="empty-state">
                <Clock size={48} />
                <h3>No {nominationFilter} nominations found</h3>
                <p>When students submit nominations, they will appear here for review.</p>
              </div>
            ) : (
              <div className="nominations-review-list">
                {filteredNominations.map((nom) => (
                  <div key={nom.id} className="nomination-review-card">
                    <div className="nom-card-left">
                      {nom.photo_url ? (
                        <img src={nom.photo_url} alt={nom.nominee_name} className="nom-review-photo" />
                      ) : (
                        <div className="nom-review-photo-fallback">
                          <User size={36} color="var(--color-border)" />
                        </div>
                      )}

                      <span className={`status-badge status-${nom.status}`}>
                        {nom.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="nom-card-center">
                      <div className="nom-card-topline">
                        <h3>{nom.nominee_name}</h3>
                        <span className="nom-category-tag">
                          {nom.categories?.name || 'Category ID: ' + nom.category_id}
                        </span>
                      </div>

                      <div className="nom-card-meta">
                        {nom.course && <span><strong>Course:</strong> {nom.course}</span>}
                        {nom.year_of_study && <span>• <strong>Year:</strong> {nom.year_of_study}</span>}
                        {nom.submitted_by && <span>• <strong>Nominated By:</strong> {nom.submitted_by}</span>}
                        <span>• <strong>Date:</strong> {new Date(nom.created_at).toLocaleDateString()}</span>
                      </div>

                      {nom.short_profile && (
                        <div className="nom-info-block">
                          <strong>Profile:</strong> {nom.short_profile}
                        </div>
                      )}

                      {nom.achievements && (
                        <div className="nom-info-block">
                          <strong>Key Achievements:</strong> {nom.achievements}
                        </div>
                      )}

                      {nom.reason && (
                        <div className="nom-info-block reason">
                          <strong>Reason for nomination:</strong> {nom.reason}
                        </div>
                      )}
                    </div>

                    <div className="nom-card-actions">
                      {nom.status === 'pending' ? (
                        <>
                          <button
                            className="btn btn-primary btn-sm btn-approve"
                            onClick={() => handleApproveNomination(nom.id)}
                            title="Approve and promote to published nominee"
                          >
                            <Check size={16} /> Approve & Publish
                          </button>
                          <button
                            className="btn btn-outline btn-sm btn-reject"
                            onClick={() => handleRejectNomination(nom.id)}
                            title="Reject nomination"
                          >
                            <X size={16} /> Reject
                          </button>
                        </>
                      ) : nom.status === 'approved' ? (
                        <div className="approved-indicator">
                          <CheckCircle size={18} color="var(--color-success)" />
                          <span>Published</span>
                        </div>
                      ) : (
                        <div className="rejected-indicator">
                          <X size={18} color="var(--color-error)" />
                          <span>Rejected</span>
                        </div>
                      )}

                      <button
                        className="btn-icon-delete"
                        onClick={() => handleDeleteNomination(nom.id)}
                        title="Delete nomination record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Manage Nominees */}
        {activeTab === 'nominees' && (
          <div className="admin-content-card">
            <div className="admin-card-header">
              <div>
                <h2>Published Nominees Directory</h2>
                <p>Active candidates receiving votes in the Comrade Choice Awards 2026.</p>
              </div>

              <button className="btn btn-gold btn-sm" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Add New Nominee
              </button>
            </div>

            {/* Filter Bar */}
            <div className="nominees-filter-bar">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search nominee by name or course..."
                  className="form-control"
                  value={nomineeSearch}
                  onChange={(e) => setNomineeSearch(e.target.value)}
                />
              </div>

              <select
                className="form-control cat-select"
                value={nomineeCategoryFilter}
                onChange={(e) => setNomineeCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nominee</th>
                    <th>Category</th>
                    <th>Course & Year</th>
                    <th>Points</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNominees.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        No nominees found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredNominees.map((nom) => (
                      <tr key={nom.id}>
                        <td>
                          <div className="table-nominee-cell">
                            {nom.photo_url ? (
                              <img src={nom.photo_url} alt={nom.name} className="table-avatar" />
                            ) : (
                              <div className="table-avatar-fallback">
                                <User size={20} color="var(--color-border)" />
                              </div>
                            )}
                            <div>
                              <strong>{nom.name}</strong>
                              <Link
                                to={`/nominees/${nom.id}`}
                                className="external-link"
                                target="_blank"
                                rel="noreferrer"
                              >
                                View Profile <ExternalLink size={12} />
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="nom-category-tag">
                            {nom.categories?.name || categories.find((c) => c.id === nom.category_id)?.name || 'Category'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            {nom.course || 'N/A'} {nom.year_of_study ? `• ${nom.year_of_study}` : ''}
                          </span>
                        </td>
                        <td>
                          <div className="table-points-badge">
                            <Trophy size={14} color="var(--color-accent)" />
                            <strong>{(nom.total_points || 0).toLocaleString()}</strong>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn-table-delete"
                            onClick={() => handleDeleteNominee(nom.id, nom.name)}
                            title="Remove nominee"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Categories Overview */}
        {activeTab === 'categories' && (
          <div className="admin-content-card">
            <div className="admin-card-header">
              <div>
                <h2>Award Categories Standing</h2>
                <p>19 Categories established for the Dedan Kimathi University student awards.</p>
              </div>
            </div>

            <div className="categories-admin-grid">
              {categories.map((cat, idx) => {
                const catNominees = nominees.filter((n) => n.category_id === cat.id);
                const leader = catNominees.sort((a, b) => (b.total_points || 0) - (a.total_points || 0))[0];

                return (
                  <div key={cat.id} className="category-admin-card">
                    <div className="cat-admin-header">
                      <span className="cat-order">#{idx + 1}</span>
                      <span className="cat-admin-type">{cat.type}</span>
                    </div>

                    <h3>{cat.name}</h3>

                    <div className="cat-admin-stats">
                      <div>
                        <span className="cat-stat-num">{catNominees.length}</span>
                        <span className="cat-stat-lbl">Nominees</span>
                      </div>

                      {leader && (
                        <div style={{ textAlign: 'right' }}>
                          <span className="cat-stat-leader">Leader: {leader.name.split(' ')[0]}</span>
                          <span className="cat-stat-pts">{(leader.total_points || 0).toLocaleString()} pts</span>
                        </div>
                      )}
                    </div>

                    <Link to={`/categories/${cat.slug}`} className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                      View Category Page
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ADD NOMINEE MODAL */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add Official Nominee</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddNomineeSubmit} style={{ padding: 'var(--space-lg)' }}>
                <div className="form-group">
                  <label>Nominee / Organization Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full name"
                    value={newNominee.name}
                    onChange={(e) => setNewNominee({ ...newNominee, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Award Category *</label>
                  <CategorySelect
                    value={newNominee.category_id}
                    categories={categories}
                    onChange={(e) => setNewNominee({ ...newNominee, category_id: e.target.value })}
                    required
                    placeholder="Select category..."
                  />
                </div>

                {/* Display Image Upload with 500KB limit */}
                <div className="form-group">
                  <label>
                    Display Image <span className="label-subtext">(Max 500KB)</span>
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                    {newNominee.photo_url ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={newNominee.photo_url}
                          alt="Nominee preview"
                          style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover', border: '2px solid var(--color-accent)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setNewNominee({ ...newNominee, photo_url: '' })}
                          style={{
                            position: 'absolute', top: -6, right: -6, background: 'var(--color-error)',
                            color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => modalFileInputRef.current?.click()}
                        disabled={modalUploading}
                      >
                        {modalUploading ? <Loader2 size={16} className="spin-icon" /> : <UploadCloud size={16} />}
                        {modalUploading ? 'Uploading...' : 'Upload Display Photo'}
                      </button>
                    )}

                    <input
                      type="file"
                      ref={modalFileInputRef}
                      style={{ display: 'none' }}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleModalImageUpload}
                    />

                    <input
                      type="url"
                      className="form-control"
                      placeholder="Or paste image URL"
                      style={{ flex: 1 }}
                      value={newNominee.photo_url}
                      onChange={(e) => setNewNominee({ ...newNominee, photo_url: e.target.value })}
                    />
                  </div>
                  {modalImageError && <p className="image-error-msg">{modalImageError}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label>Course / Programme</label>
                    <CourseSelect
                      value={newNominee.course}
                      onChange={(e) => setNewNominee({ ...newNominee, course: e.target.value })}
                      placeholder="Select course..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Year of Study</label>
                    <YearSelect
                      value={newNominee.year_of_study}
                      onChange={(e) => setNewNominee({ ...newNominee, year_of_study: e.target.value })}
                      placeholder="Select year..."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Short Biography</label>
                  <textarea
                    className="form-control"
                    placeholder="Brief background..."
                    value={newNominee.bio}
                    onChange={(e) => setNewNominee({ ...newNominee, bio: e.target.value })}
                    style={{ minHeight: '70px' }}
                  />
                </div>

                <div className="form-group">
                  <label>Achievements</label>
                  <textarea
                    className="form-control"
                    placeholder="Notable achievements..."
                    value={newNominee.achievements}
                    onChange={(e) => setNewNominee({ ...newNominee, achievements: e.target.value })}
                    style={{ minHeight: '70px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-gold">
                    Add Nominee
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
