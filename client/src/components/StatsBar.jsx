export default function StatsBar({ categoriesCount = 0, nomineesCount = 0 }) {
  return (
    <section className="stats-bar" id="stats-bar">
      <div className="container">
        <div className="stats-bar-inner">
          <div className="stat-item">
            <span className="stat-number">{categoriesCount}+</span>
            <span className="stat-label">Categories</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{nomineesCount}</span>
            <span className="stat-label">Nominees</span>
          </div>
          <div className="stat-item">
            <span className="stat-number" style={{ color: 'var(--color-accent)' }}>Live</span>
            <span className="stat-label">Voting Phase</span>
          </div>
        </div>
      </div>
    </section>
  );
}
