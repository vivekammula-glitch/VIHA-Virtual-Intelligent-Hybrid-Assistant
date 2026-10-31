import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getUser, clearUser } from '../lib/store.js';

export default function Nav() {
  const nav = useNavigate();
  return (
    <nav className="nav"><div className="wrap row between">
      <Link to="/dashboard"><img src="/logo.png" alt="VIHA" className="logo-img" /></Link>
      <div className="row gap">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/tutor">AI Tutor</NavLink>
        <span className="muted">Hi, {getUser()}</span>
        <a href="#" onClick={(e) => { e.preventDefault(); clearUser(); nav('/'); }}>Sign out</a>
      </div>
    </div></nav>
  );
}