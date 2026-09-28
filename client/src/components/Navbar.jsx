import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Award, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" id="navbar-brand">
          <Award size={28} />
          <span>Comrade Choice Awards</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          id="navbar-toggle"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul className={`navbar-links ${open ? 'open' : ''}`} id="navbar-links">
          <li>
            <NavLink to="/" end onClick={() => setOpen(false)} id="navbar-home-link">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/nominees" onClick={() => setOpen(false)} id="navbar-nominees-link">
              Nominees
            </NavLink>
          </li>
          <li>
            <NavLink to="/results" onClick={() => setOpen(false)}>
              Results
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/nominate"
              className="navbar-cta"
              onClick={() => setOpen(false)}
              id="navbar-nominate-btn"
            >
              Nominate
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
