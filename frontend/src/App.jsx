import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register'; // Importar el nuevo componente
import DashboardLayout from './components/DashboardLayout';
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId="250193403650-a45q0gkm35gs9pcmu80fhd3g55314kc1.apps.googleusercontent.com">
  <App />
</GoogleOAuthProvider>

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Nueva ruta de registro */}
        <Route path="/registro" element={<Register />} /> 
        
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
  );
}

export default App;