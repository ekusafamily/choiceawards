import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            Comrade Choice Awards {year}
          </div>

          <ul className="footer-links">
            <li>
              <Link to="/categories">Categories</Link>
            </li>
            <li>
              <Link to="/nominate">Nominate</Link>
            </li>
            <li>
              <Link to="/results">Results</Link>
            </li>
            <li>
              <a
                href="https://studentwelfare.dkut.ac.ke/"
                target="_blank"
                rel="noopener noreferrer"
              >
                DeKUT Student Welfare
              </a>
            </li>
          </ul>

          <p className="footer-copy">
            Copyright &copy; {year} DeKUTSO. Dedan Kimathi University of Technology.
          </p>
        </div>
      </div>
    </footer>
  );
}
