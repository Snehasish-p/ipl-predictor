import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login     from './pages/Login';
import Register from './pages/Register';
import Home      from './pages/Home';
//import Results   from './pages/Results';
import Standings from './pages/Standings';
import PointsTable from "./pages/PointsTable";


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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/standings" element={<PrivateRoute><Standings /></PrivateRoute>} />
          <Route path="/points-table" element={<PointsTable />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}