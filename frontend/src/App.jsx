import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import { GoogleOAuthProvider } from '@react-oauth/google';
import CompletarRegistro from './components/CompletarRegistro';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (user && user.perfil_completo === false) {
    return <Navigate to="/completar-registro" replace />;
  }

  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId="250193403650-a45q0gkm35gs9pcmu80fhd3g55314kc1.apps.googleusercontent.com">
      <Router>
        <Routes>
          <Route path="/completar-registro" element={<CompletarRegistro />} />
          <Route path="/" element={<Login />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;