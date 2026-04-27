import React, { useState, useEffect } from 'react';
import { Search, Shield, User, GraduationCap, AlertCircle, RefreshCw } from 'lucide-react';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [actualizandoId, setActualizandoId] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // URL CORREGIDA: Agregado el /auth
      const response = await fetch('http://localhost:4000/api/auth/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        setError('No se pudieron cargar los usuarios.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarRol = async (id_usuario, nuevoRol) => {
    if (!window.confirm(`¿Estás seguro de cambiar el rol a ${nuevoRol}?`)) return;

    setActualizandoId(id_usuario);
    try {
      const token = localStorage.getItem('token');
      // URL CORREGIDA: Agregado el /auth
      const response = await fetch(`http://localhost:4000/api/auth/usuarios/${id_usuario}/rol`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rol: nuevoRol })
      });

      if (response.ok) {
        setUsuarios(usuarios.map(u => 
          u.id_usuario === id_usuario ? { ...u, rol: nuevoRol } : u
        ));
      } else {
        alert('Error al actualizar el rol');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al actualizar');
    } finally {
      setActualizandoId(null);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getRolBadge = (rol) => {
    switch (rol) {
      case 'admin':
        return (
          <span className="px-3 py-1 bg-gray-900 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-max shadow-sm">
            <Shield className="w-3.5 h-3.5" /> Admin
          </span>
        );
      case 'docente':
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-max">
            <GraduationCap className="w-3.5 h-3.5" /> Docente
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-max">
            <User className="w-3.5 h-3.5" /> Estudiante
          </span>
        );
    }
  };

  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in duration-500">
      
      {/* HEADER Y BUSCADOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Usuarios y Roles</h2>
          <p className="text-sm text-gray-500 mt-1">Gestiona los accesos y privilegios de la comunidad IT Oaxaca.</p>
        </div>

        <div className="relative w-full sm:w-72 flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-shadow bg-gray-50 focus:bg-white"
          />
        </div>
      </div>

      {/* ESTADO DE CARGA / ERROR */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-gray-300" />
          <p className="text-sm font-medium">Cargando directorio de usuarios...</p>
        </div>
      ) : (
        /* TABLA DE USUARIOS */
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol Actual</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Acción (Asignar Rol)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id_usuario} className="hover:bg-gray-50/50 transition-colors group">
                    
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-bold flex-shrink-0" translate="no">
                          {usuario.nombre_completo.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm" translate="no">{usuario.nombre_completo}</p>
                          <p className="text-xs text-gray-500">{usuario.correo}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {getRolBadge(usuario.rol)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <select
                        value={usuario.rol}
                        onChange={(e) => handleCambiarRol(usuario.id_usuario, e.target.value)}
                        disabled={actualizandoId === usuario.id_usuario}
                        className={`p-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer bg-white hover:bg-gray-50
                          ${actualizandoId === usuario.id_usuario ? 'opacity-50 cursor-wait' : ''}
                        `}
                      >
                        <option value="estudiante">Estudiante</option>
                        <option value="docente">Docente</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-gray-400 text-sm">
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}