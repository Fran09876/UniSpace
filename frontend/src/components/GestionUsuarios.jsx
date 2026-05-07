import React, { useState, useEffect } from 'react';
import { Search, Shield, User, Mail, Key, UserPlus, RefreshCw, X, Edit2, Filter } from 'lucide-react';
import { api } from '../utils/api';

const initialForm = {
  nombre_completo: '',
  correo: '',
  password: '',
  rol: 'estudiante',
  curp: '',
  carrera: '',
  especialidad: '',
  grado_academico: '',
};

// 🔥 Badges de rol con colores
const rolBadges = {
  estudiante: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    label: 'Estudiante',
  },
  docente: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    label: 'Docente',
  },
  admin: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    label: 'Administrador',
  },
};

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🔥 Filtrado mejorado
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState(''); // Todos, estudiante, docente, admin

  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [creando, setCreando] = useState(false);
  const [registroMsg, setRegistroMsg] = useState({ texto: '', tipo: '' });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/auth/usuarios');
      if (!response.ok) {
        setError('No se pudieron cargar los usuarios.');
        return;
      }

      const lista = await response.json();
      setUsuarios(lista);
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFormData(initialForm);
    setModoEdicion(false);
    setUsuarioEditando(null);
    setRegistroMsg({ texto: '', tipo: '' });
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setCreando(true);

    // 🔥 VALIDACIÓN: CURP es obligatorio
    if (!formData.curp.trim()) {
      setRegistroMsg({ texto: 'CURP es obligatorio.', tipo: 'error' });
      setCreando(false);
      return;
    }

    try {
      const payload = {
        nombre_completo: formData.nombre_completo.trim(),
        correo: formData.correo.trim().toLowerCase(),
        rol: formData.rol,
        curp: formData.curp.trim().toUpperCase(),
        carrera: formData.rol === 'estudiante' ? formData.carrera.trim() || null : null,
        especialidad: formData.rol === 'docente' ? formData.especialidad.trim() || null : null,
        grado_academico: formData.rol === 'docente' ? formData.grado_academico.trim() || null : null,
      };

      if (!modoEdicion) {
        payload.password = formData.password;
      }

      const response = modoEdicion
        ? await api.put(`/auth/usuarios/${usuarioEditando.id_usuario}`, payload)
        : await api.post('/auth/registro', payload);

      const data = await response.json();

      if (!response.ok) {
        setRegistroMsg({ texto: data.mensaje || 'Error inesperado.', tipo: 'error' });
        return;
      }

      setRegistroMsg({
        texto: modoEdicion ? 'Usuario actualizado correctamente.' : 'Usuario registrado correctamente.',
        tipo: 'success',
      });
      cargarUsuarios();

      setTimeout(() => {
        setShowModal(false);
        resetModal();
      }, 1400);
    } catch {
      setRegistroMsg({ texto: 'Error de conexión.', tipo: 'error' });
    } finally {
      setCreando(false);
    }
  };

  const handleEditar = (usuario) => {
    setModoEdicion(true);
    setUsuarioEditando(usuario);
    setFormData({
      nombre_completo: usuario.nombre_completo,
      correo: usuario.correo,
      password: '',
      rol: usuario.rol,
      curp: usuario.curp || '',
      carrera: usuario.carrera || '',
      especialidad: usuario.especialidad || '',
      grado_academico: usuario.grado_academico || '',
    });
    setShowModal(true);
  };

  // 🔥 Filtrado combinado: nombre, correo, CURP y Rol
  const usuariosFiltrados = usuarios.filter((u) => {
    const filtroTexto = busqueda.toLowerCase();
    const cumpleBusqueda =
      u.nombre_completo.toLowerCase().includes(filtroTexto) ||
      u.correo.toLowerCase().includes(filtroTexto) ||
      (u.curp && u.curp.toLowerCase().includes(filtroTexto));

    const cumpleRol = filtroRol === '' || u.rol === filtroRol;

    return cumpleBusqueda && cumpleRol;
  });

  const roleInfo = (u) => {
    if (u.rol === 'estudiante' && u.carrera) return `Carrera: ${u.carrera}`;
    if (u.rol === 'docente') {
      const extras = [
        u.especialidad && `Esp.: ${u.especialidad}`,
        u.grado_academico && `Grado: ${u.grado_academico}`,
      ].filter(Boolean);
      return extras.join(' · ') || 'Docente';
    }
    return 'Administrador';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Directorio de Usuarios</h2>
          <p className="text-sm text-gray-500">Administra los accesos, roles y datos de los usuarios.</p>
        </div>
        <div className="flex w-full md:w-auto gap-3 flex-col sm:flex-row">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o CURP..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* 🔥 Filtro por Rol */}
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Todos los roles</option>
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="button"
            onClick={() => {
              resetModal();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md shadow-gray-200 active:scale-95 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-600">{error}</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <p className="text-sm">No se encontraron usuarios con esos criterios de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="py-4 px-8">Nombre</th>
                  <th className="py-4 px-8">Rol</th>
                  <th className="py-4 px-8">CURP</th>
                  <th className="py-4 px-8">Detalle</th>
                  <th className="py-4 px-8">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuariosFiltrados.map((u) => {
                  const badge = rolBadges[u.rol];
                  return (
                    <tr key={u.id_usuario} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-8">
                        <p className="font-semibold text-gray-900">{u.nombre_completo}</p>
                        <p className="text-xs text-gray-400">{u.correo}</p>
                      </td>
                      <td className="py-4 px-8">
                        {/* 🔥 Badge de rol con color */}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-8 font-mono text-xs text-gray-500">{u.curp || '—'}</td>
                      <td className="py-4 px-8 text-xs text-gray-500">{roleInfo(u)}</td>
                      <td className="py-4 px-8">
                        <button
                          type="button"
                          onClick={() => handleEditar(u)}
                          className="inline-flex items-center justify-center p-2 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
                          aria-label="Editar usuario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleRegistro}
            className="w-full max-w-2xl bg-white rounded-[28px] shadow-2xl p-6 md:p-8 space-y-5 relative"
          >
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetModal();
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {modoEdicion ? 'Editar usuario' : 'Registrar nuevo usuario'}
                </h3>
                <p className="text-sm text-gray-500">
                  {modoEdicion
                    ? 'Actualiza los datos del usuario existente.'
                    : 'Agrega un nuevo usuario con rol y datos especiales.'}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                <Shield className="w-4 h-4" />
                {modoEdicion ? 'Modo edición' : 'Usuario nuevo'}
              </span>
            </div>

            {registroMsg.texto && (
              <div className={`rounded-2xl px-4 py-3 text-sm ${
                registroMsg.tipo === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {registroMsg.texto}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-700">
                <span>Nombre completo</span>
                <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    className="w-full bg-transparent outline-none text-sm text-gray-900"
                    placeholder="Ej. Ana Pérez"
                    required
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm text-gray-700">
                <span>Correo institucional</span>
                <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full bg-transparent outline-none text-sm text-gray-900"
                    placeholder="usuario@itoaxaca.edu.mx"
                    disabled={modoEdicion}
                    required
                  />
                </div>
              </label>

              {!modoEdicion && (
                <label className="space-y-2 text-sm text-gray-700">
                  <span>Contraseña</span>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2">
                    <Key className="w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-transparent outline-none text-sm text-gray-900"
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                  </div>
                </label>
              )}

              <label className="space-y-2 text-sm text-gray-700">
                <span>CURP (obligatorio)</span>
                <input
                  type="text"
                  value={formData.curp}
                  onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Ej. PQRE120345HDFNNXA00"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-gray-700">
                <span>Rol</span>
                <select
                  value={formData.rol}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rol: e.target.value,
                      carrera: e.target.value === 'estudiante' ? formData.carrera : '',
                      especialidad: e.target.value === 'docente' ? formData.especialidad : '',
                      grado_academico: e.target.value === 'docente' ? formData.grado_academico : '',
                    })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              {formData.rol === 'estudiante' && (
                <label className="space-y-2 text-sm text-gray-700">
                  <span>Carrera</span>
                  <input
                    type="text"
                    value={formData.carrera}
                    onChange={(e) => setFormData({ ...formData, carrera: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="Ej. Ingeniería en Sistemas"
                  />
                </label>
              )}

              {formData.rol === 'docente' && (
                <>
                  <label className="space-y-2 text-sm text-gray-700">
                    <span>Especialidad</span>
                    <input
                      type="text"
                      value={formData.especialidad}
                      onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Ej. Redes y Telecomunicaciones"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-gray-700">
                    <span>Grado académico</span>
                    <input
                      type="text"
                      value={formData.grado_academico}
                      onChange={(e) => setFormData({ ...formData, grado_academico: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Ej. Maestro en Ciencias"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetModal();
                }}
                className="w-full sm:w-auto px-5 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  creando ||
                  !formData.nombre_completo.trim() ||
                  !formData.correo.trim() ||
                  !formData.curp.trim() ||
                  (!modoEdicion && !formData.password.trim())
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-gray-900 rounded-2xl hover:bg-black transition-colors disabled:opacity-50"
              >
                {creando ? 'Guardando...' : modoEdicion ? 'Actualizar usuario' : 'Registrar usuario'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}