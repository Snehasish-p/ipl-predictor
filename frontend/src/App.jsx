import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar      from './components/Navbar';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Home        from './pages/Home';
import Matches     from './pages/Matches';
import Standings   from './pages/Standings';
import PointsTable from './pages/PointsTable';
import SelectionsOverview from './pages/SelectionsOverview';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/"             element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/matches"      element={<PrivateRoute><Matches /></PrivateRoute>} />
          <Route path="/selections" element={<PrivateRoute><SelectionsOverview /></PrivateRoute>} />
          <Route path="/standings"    element={<PrivateRoute><Standings /></PrivateRoute>} />
          <Route path="/points-table" element={<PrivateRoute><PointsTable /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}