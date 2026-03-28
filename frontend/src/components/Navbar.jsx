import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav>
      <span className="nav-brand">🏏 IPL</span>

      <Link to="/"              className={isActive('/')              ? 'active' : ''}>Pick Team</Link>
      <Link to="/standings"     className={isActive('/standings')     ? 'active' : ''}>Standings</Link>
      <Link to="/points-table"  className={isActive('/points-table')  ? 'active' : ''}>Points</Link>

      <div className="nav-spacer" />

      <div className="nav-user">
        <div className="nav-avatar">{user.name?.[0]?.toUpperCase()}</div>
        <span className="nav-username">{user.name}</span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
