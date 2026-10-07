import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import NominationForm from '../components/NominationForm';

export default function Nominate() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    document.title = 'Nominate a Candidate • DeKUTSO Comrade Choice Awards 2026';
    async function fetch() {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetch();
  }, []);

  return (
    <div className="nominate-page page">
      <div className="container">
        <div className="section-title">
          <h2>Nominate a Candidate</h2>
          <hr className="gold-line" />
          <p>
            Recognize outstanding individuals and organizations in the DeKUT community.
          </p>
        </div>

        <NominationForm categories={categories} />
      </div>
    </div>
  );
}
