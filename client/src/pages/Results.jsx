import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import LeaderboardTable from '../components/LeaderboardTable';

export default function Results() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => {
    document.title = 'Results & Leaderboards • DeKUTSO Comrade Choice Awards 2026';
    async function fetch() {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data);
        if (data.length > 0) {
          setSelectedSlug(data[0].slug);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;

    async function fetchLeaderboard() {
      setLbLoading(true);
      try {
        const { data } = await apiClient.get(`/leaderboard/${selectedSlug}`);
        setLeaderboardData(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setLeaderboardData(null);
      } finally {
        setLbLoading(false);
      }
    }
    fetchLeaderboard();
  }, [selectedSlug]);

  return (
    <div className="page">
      <div className="container">
        <div className="section-title">
          <h2>Voting Results & Standings</h2>
          <hr className="gold-line" />
          <p>
            Nominations are currently ongoing. Official points and live standings will be revealed once voting commences.
          </p>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Category selector */}
            <div className="form-group" style={{ maxWidth: '500px', margin: '0 auto var(--space-2xl)' }}>
              <label htmlFor="results-category">Select Category</label>
              <select
                id="results-category"
                className="form-control"
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {lbLoading ? (
              <div className="loading-spinner">
                <div className="spinner" />
              </div>
            ) : leaderboardData ? (
              <LeaderboardTable
                nominees={leaderboardData.nominees || []}
                categoryName={leaderboardData.category?.name || ''}
              />
            ) : (
              <div className="empty-state">
                <p>No results available for this category.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
