import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nombre_completo: '', correo: '', password: '', rol: 'estudiante' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Limpiamos errores previos

    try {
      // 1. Aquí defines "response"
      const response = await fetch('http://localhost:4000/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // 2. ERROR CORREGIDO: Usamos "response" en lugar de "res"
      const data = await response.json(); 

      // 3. ERROR CORREGIDO: Usamos "response.ok"
      if (response.ok) {
        alert('¡Registro exitoso! Ahora inicia sesión.');
        navigate('/'); // O a la ruta de tu login
      } else {
        // Si el servidor responde un error (ej. correo duplicado)
        setError(data.mensaje || 'Error al registrar');
      }
    } catch (err) {
      // Si entra aquí es porque NO hubo conexión o hubo un error de código arriba
      console.error("Detalle del error:", err);
      setError('Error al conectar con el servidor o error en el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full font-sans bg-white">
      {/* Lado Izquierdo (Decorativo) */}
      <div className="hidden lg:flex flex-col justify-center flex-1 bg-gray-50 px-12">
        <div className="max-w-sm mx-auto">
          <h2 className="text-4xl font-bold mb-4">Únete a UniSpace</h2>
          <p className="text-gray-600">Gestiona laboratorios, aulas y recursos del IT Oaxaca de forma sencilla.</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Crea tu cuenta</h1>
          {error && <div className="bg-red-50 text-red-600 p-3 mb-4 rounded border border-red-200 text-sm">{error}</div>}
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre completo</label>
              <input type="text" name="nombre_completo" required onChange={handleChange} className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-black outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Correo Institucional</label>
              <input type="email" name="correo" required onChange={handleChange} className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-black outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Contraseña</label>
              <input type="password" name="password" required onChange={handleChange} className="w-full p-2 border rounded mt-1 focus:ring-2 focus:ring-black outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de usuario...</label>
              <select name="rol" onChange={handleChange} className="w-full p-2 border rounded mt-1 outline-none">
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
              </select>
            </div>
            <button disabled={loading} className="w-full bg-black text-white p-2 rounded hover:bg-gray-800 transition-all font-medium">
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