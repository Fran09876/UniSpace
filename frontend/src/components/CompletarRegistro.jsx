import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CompletarRegistro() {
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const [rol, setRol] = useState('estudiante');
  const [curp, setCurp] = useState('');
  const [carrera, setCarrera] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [gradoAcademico, setGradoAcademico] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMensaje('');

    try {
      const response = await fetch(
        `/api/auth/completar-google/${usuario.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id_usuario: usuario.id,
            rol,
            curp,
            carrera,
            especialidad,
            grado_academico: gradoAcademico,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMensaje(data.mensaje || 'Error al completar registro');
        return;
      }

      const nuevoUsuario = {
        ...usuario,
        rol,
        perfil_completo: true
      };

      localStorage.setItem('user', JSON.stringify(nuevoUsuario));

      navigate('/dashboard');

    } catch (error) {
      setMensaje('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl">
        
        <h1 className="text-2xl font-bold text-center mb-2">
          Completa tu registro
        </h1>

        <p className="text-gray-500 text-center mb-6">
          Configura tu cuenta para continuar
        </p>

        {mensaje && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl text-center">
            {mensaje}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm mb-1">
              Rol
            </label>

            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full border p-3 rounded-xl"
            >
              <option value="estudiante">
                Estudiante
              </option>

              <option value="docente">
                Docente
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">
              CURP
            </label>

            <input
              type="text"
              value={curp}
              onChange={(e) => setCurp(e.target.value.toUpperCase())}
              className="w-full border p-3 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-3 rounded-xl"
              required
            />
          </div>

          {rol === 'estudiante' && (
            <div>
              <label className="block text-sm mb-1">
                Carrera
              </label>

              <input
                type="text"
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
                className="w-full border p-3 rounded-xl"
                required
              />
            </div>
          )}

          {rol === 'docente' && (
            <>
              <div>
                <label className="block text-sm mb-1">
                  Especialidad
                </label>

                <input
                  type="text"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  className="w-full border p-3 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">
                  Grado académico
                </label>

                <input
                  type="text"
                  value={gradoAcademico}
                  onChange={(e) => setGradoAcademico(e.target.value)}
                  className="w-full border p-3 rounded-xl"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-xl font-semibold"
          >
            {loading ? 'Guardando...' : 'Finalizar registro'}
          </button>

        </form>
      </div>
    </div>
  );
}
