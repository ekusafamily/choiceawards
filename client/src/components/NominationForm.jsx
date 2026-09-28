import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import apiClient from '../api/client';
import CourseSelect from './CourseSelect';
import CategorySelect from './CategorySelect';
import YearSelect from './YearSelect';

const MAX_IMAGE_SIZE_BYTES = 500 * 1024; // 500 KB limit

export default function NominationForm({ categories = [] }) {
  const [formData, setFormData] = useState({
    nominee_name: '',
    course: '',
    year_of_study: '',
    category_id: '',
    photo_url: '',
    short_profile: '',
    achievements: '',
    reason: '',
    submitted_by: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [imageError, setImageError] = useState('');
  const [useUrlFallback, setUseUrlFallback] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  // Handle image file selection & immediate upload
  async function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setUploadSuccess(false);

    // 1. Strict 500KB validation on the client
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeKb = (file.size / 1024).toFixed(1);
      setImageError(`Image size is ${sizeKb}KB, which exceeds the 500KB limit. Please choose a smaller image.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setImageError('Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 3. Set preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setImageFile(file);

    // 4. Upload via /api/upload
    setUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await apiClient.post('/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, photo_url: res.data.url }));
        setUploadSuccess(true);
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to upload image. Please try again.';
      setImageError(msg);
    } finally {
      setUploadingImage(false);
    }
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setUploadSuccess(false);
    setImageError('');
    setFormData((prev) => ({ ...prev, photo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.nominee_name || !formData.category_id) {
      setError('Nominee name and category are required.');
      return;
    }

    if (uploadingImage) {
      setError('Please wait for the image to finish uploading.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await apiClient.post('/nominations', formData);
      setSuccess(true);
      handleRemoveImage();
      setFormData({
        nominee_name: '',
        course: '',
        year_of_study: '',
        category_id: '',
        photo_url: '',
        short_profile: '',
        achievements: '',
        reason: '',
        submitted_by: '',
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to submit nomination.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="nominate-form-wrapper" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <CheckCircle size={64} color="var(--color-success)" style={{ margin: '0 auto' }} />
        </div>
        <h2>Nomination Submitted</h2>
        <hr className="gold-line" />
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-xl)' }}>
          Your nomination and display image have been submitted for review. Once approved, the nominee
          will appear on the awards portal.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => setSuccess(false)}
          id="nominate-another-btn"
        >
          Submit Another Nomination
        </button>
      </div>
    );
  }

  return (
    <div className="nominate-form-wrapper">
      <h2>Submit a Nomination</h2>
      <hr className="gold-line" style={{ margin: 'var(--space-md) 0' }} />
      <p className="form-description">
        Nominate an eligible individual or organization for the Comrade Choice Awards 2026.
        All nominations undergo review before nominees are officially published.
      </p>

      <form onSubmit={handleSubmit} id="nomination-form">
        <div className="form-group">
          <label htmlFor="nominee_name">Name of Nominee *</label>
          <input
            type="text"
            id="nominee_name"
            name="nominee_name"
            className="form-control"
            placeholder="Enter nominee's full name"
            value={formData.nominee_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category_id">Award Category *</label>
          <CategorySelect
            id="category_id"
            name="category_id"
            value={formData.category_id}
            categories={categories}
            onChange={handleChange}
            required
            placeholder="Select an award category..."
          />
        </div>

        {/* Display Image Upload (Max 500KB) */}
        <div className="form-group image-upload-group">
          <label>
            Nominee Display Image <span className="label-subtext">(Max 500KB)</span>
          </label>

          {!useUrlFallback ? (
            <div className="image-upload-box">
              {!imagePreview ? (
                <div
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: 'none' }}
                    id="nominee_image_input"
                  />
                  <UploadCloud size={36} className="upload-icon" />
                  <div className="upload-text">
                    <strong>Click to upload display photo</strong>
                    <p>PNG, JPG, WebP, GIF up to 500KB</p>
                  </div>
                </div>
              ) : (
                <div className="image-preview-card">
                  <img src={imagePreview} alt="Nominee preview" className="preview-thumbnail" />
                  <div className="preview-details">
                    <div className="preview-name">{imageFile?.name || 'Nominee Image'}</div>
                    <div className="preview-size">
                      {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ''}
                    </div>

                    {uploadingImage && (
                      <div className="upload-status uploading">
                        <Loader2 size={14} className="spin-icon" /> Uploading image...
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="upload-status success">
                        <CheckCircle size={14} /> Image uploaded successfully
                      </div>
                    )}

                    {imageError && (
                      <div className="upload-status error">
                        <AlertCircle size={14} /> {imageError}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={handleRemoveImage}
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {imageError && !imagePreview && (
                <div className="image-error-msg">
                  <AlertCircle size={16} /> {imageError}
                </div>
              )}

              <div className="url-toggle-row">
                <button
                  type="button"
                  className="btn-link-toggle"
                  onClick={() => setUseUrlFallback(true)}
                >
                  Or enter image URL manually
                </button>
              </div>
            </div>
          ) : (
            <div className="image-url-box">
              <input
                type="url"
                name="photo_url"
                className="form-control"
                placeholder="https://example.com/photo.jpg"
                value={formData.photo_url}
                onChange={handleChange}
              />
              <div className="url-toggle-row">
                <button
                  type="button"
                  className="btn-link-toggle"
                  onClick={() => {
                    setUseUrlFallback(false);
                    setFormData((prev) => ({ ...prev, photo_url: '' }));
                  }}
                >
                  ← Back to file upload (500KB limit)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="course">Course / Programme</label>
          <CourseSelect
            id="course"
            name="course"
            value={formData.course}
            onChange={handleChange}
            placeholder="Select or search course / programme..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="year_of_study">Year of Study</label>
          <YearSelect
            id="year_of_study"
            name="year_of_study"
            value={formData.year_of_study}
            onChange={handleChange}
            placeholder="Select year of study..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="short_profile">Short Profile</label>
          <textarea
            id="short_profile"
            name="short_profile"
            className="form-control"
            placeholder="Briefly describe the nominee..."
            value={formData.short_profile}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="achievements">Achievements</label>
          <textarea
            id="achievements"
            name="achievements"
            className="form-control"
            placeholder="List key achievements..."
            value={formData.achievements}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="reason">Reason for Nomination</label>
          <textarea
            id="reason"
            name="reason"
            className="form-control"
            placeholder="Why should this person/organization win?"
            value={formData.reason}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="submitted_by">Your Name (optional)</label>
          <input
            type="text"
            id="submitted_by"
            name="submitted_by"
            className="form-control"
            placeholder="Your name"
            value={formData.submitted_by}
            onChange={handleChange}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button
          type="submit"
          className="btn btn-gold btn-lg"
          style={{ width: '100%', marginTop: 'var(--space-md)' }}
          disabled={loading || uploadingImage}
          id="nomination-submit-btn"
        >
          {loading ? 'Submitting...' : uploadingImage ? 'Uploading Image...' : 'Submit Nomination'}
        </button>
      </form>
    </div>
  );
}
