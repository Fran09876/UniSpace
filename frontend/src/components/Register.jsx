import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo: '',
    password: '',
    rol: 'estudiante' // Se mantiene por defecto
  });

  const [error, setError] = useState('');
  const [correoValido, setCorreoValido] = useState(null);
  const [passwordValido, setPasswordValido] = useState(null);
  const [loading, setLoading] = useState(false);

  const regexCorreo = /^(C?\d{8})@itoaxaca\.edu\.mx$/;
  const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });

    // Validación correo
    if (name === 'correo') {
      if (value === '') setCorreoValido(null);
      else setCorreoValido(regexCorreo.test(value));
    }

    // 🔐 Validación contraseña
    if (name === 'password') {
      if (value === '') setPasswordValido(null);
      else setPasswordValido(regexPassword.test(value));
    }
  };

  // REGISTRO NORMAL
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!regexCorreo.test(formData.correo)) {
      setError('Correo institucional inválido');
      setLoading(false);
      return;
    }

    if (!regexPassword.test(formData.password)) {
      setError('La contraseña no cumple con los requisitos');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('¡Registro exitoso! Ahora inicia sesión.');
        navigate('/login'); 
      } else {
        setError(data.mensaje || 'Error al registrar');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // REGISTRO/LOGIN CON GOOGLE
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('🔵 Registrando/Autenticando con Google...');
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: credentialResponse.credential,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario));
        console.log('✅ Auth Google exitosa');
        navigate('/dashboard'); 
      } else {
        setError(data.mensaje || 'Error al registrarse con Google');
      }
    } catch (err) {
      console.error('❌ Error Google:', err);
      setError('Error al conectar con el servidor de autenticación');
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-white">
      {/* Panel Izquierdo */}
      <div className="hidden lg:flex flex-col justify-center flex-1 bg-gray-50 px-12">
        <div className="max-w-sm mx-auto">
          <h2 className="text-4xl font-bold mb-4">Únete a UniSpace</h2>
          <p className="text-gray-600">Gestiona laboratorios, aulas y recursos del IT Oaxaca de forma sencilla.</p>
        </div>
      </div>

      {/* Panel Derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold mb-2 text-center">Crea tu cuenta</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Regístrate para comenzar</p>

          {/* BOTÓN DE GOOGLE */}
          <div className="mb-4 flex justify-center">
            <GoogleOAuthProvider clientId="250193403650-a45q0gkm35gs9pcmu80fhd3g55314kc1.apps.googleusercontent.com">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Error al conectar con Google')}
                useOneTap
                theme="outline"
                size="large"
                width="100%"
                text="signup_with" 
              />
            </GoogleOAuthProvider>
          </div>

          <div className="my-4 text-sm text-gray-600 text-center">
            <p>o regístrate con email</p>
          </div>

          {/* MENSAJE DE ERROR */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 mb-4 rounded border border-red-200 text-sm text-center">
              {error}
            </div>
          )}

          {/* FORMULARIO TRADICIONAL */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre completo</label>
              <input type="text" name="nombre_completo" required
                onChange={handleChange}
                className="w-full p-2 border rounded mt-1 outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Correo Institucional</label>
              <input type="email" name="correo" required
                onChange={handleChange}
                className={`w-full p-2 border rounded mt-1 outline-none focus:ring-2 transition-colors
                  ${correoValido === false ? 'border-red-500 focus:ring-red-200' : 'focus:ring-gray-300'}
                  ${correoValido === true ? 'border-green-500 focus:ring-green-200' : ''}`}
              />
              {correoValido === false && (
                <p className="text-red-500 text-xs mt-1">
                  Formato inválido (Ej: 12345678@itoaxaca.edu.mx)
                </p>
              )}
              {correoValido === true && (
                <p className="text-green-500 text-xs mt-1">✔ Correo válido</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Contraseña</label>
              <input type="password" name="password" required
                onChange={handleChange}
                className={`w-full p-2 border rounded mt-1 outline-none focus:ring-2 transition-colors
                  ${passwordValido === false ? 'border-red-500 focus:ring-red-200' : 'focus:ring-gray-300'}
                  ${passwordValido === true ? 'border-green-500 focus:ring-green-200' : ''}`}
              />
              {passwordValido === false && (
                <p className="text-red-500 text-xs mt-1">
                  Mínimo 8 caracteres, una mayúscula, una minúscula y un número
                </p>
              )}
              {passwordValido === true && (
                <p className="text-green-500 text-xs mt-1">✔ Contraseña segura</p>
              )}
            </div>

            <button
              disabled={loading || correoValido !== true || passwordValido !== true}
              className={`w-full p-2 rounded font-medium transition-all mt-4
                ${loading || correoValido !== true || passwordValido !== true
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'}`}
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm">
            ¿Ya tienes cuenta? <Link to="/login" className="font-bold hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
