import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav>
      <span>🏏 IPL Predictor</span>
      <Link to="/">Pick Team</Link>
      <Link to="/results">Results</Link>
      <Link to="/standings">Standings</Link>
      <Link to="/points-table">Points Table</Link>
      <span style={{ marginLeft: 'auto', color: '#aaa' }}>{user.name}</span>
      <button
        onClick={handleLogout}
        style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
      >
        Logout
      </button>
    </nav>
  );
}