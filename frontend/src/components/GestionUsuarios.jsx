import React, { useState, useEffect } from 'react';
import { Search, Shield, User, Mail, Key, UserPlus, RefreshCw, AlertCircle, X, Edit2 } from 'lucide-react';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // --- ESTADOS PARA EL MODAL Y FORMULARIO ---
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo: '',
    password: '',
    rol: 'estudiante'
  });
  const [creando, setCreando] = useState(false);
  const [registroMsg, setRegistroMsg] = useState({ texto: '', tipo: '' });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/auth/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setUsuarios(await response.json());
      } else {
        setError('No se pudieron cargar los usuarios.');
      }
    } catch (err) {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setCreando(true);
    try {
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        setRegistroMsg({ texto: 'Usuario creado con éxito', tipo: 'success' });
        setTimeout(() => {
          setShowModal(false);
          setRegistroMsg({ texto: '', tipo: '' });
          setFormData({ nombre_completo: '', correo: '', password: '', rol: 'estudiante' });
        }, 1500);
        cargarUsuarios();
      } else {
        setRegistroMsg({ texto: data.mensaje || 'Error al registrar', tipo: 'error' });
      }
    } catch (err) {
      setRegistroMsg({ texto: 'Error de conexión', tipo: 'error' });
    } finally {
      setCreando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CABECERA Y BUSCADOR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Directorio de Usuarios</h2>
          <p className="text-sm text-gray-500">Gestiona los accesos y roles del sistema</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-md shadow-gray-200 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400"><RefreshCw className="w-8 h-8 animate-spin mb-2" /><p className="text-sm">Cargando...</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="py-4 px-8 text-xs font-bold text-gray-400 uppercase">Usuario</th>
                  <th className="py-4 px-8 text-xs font-bold text-gray-400 uppercase">Rol</th>
                  <th className="py-4 px-8 text-xs font-bold text-gray-400 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id_usuario} className="hover:bg-gray-50/30 transition-colors">
                    <td className="py-4 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs">{u.nombre_completo.substring(0,2).toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{u.nombre_completo}</p>
                          <p className="text-xs text-gray-400">{u.correo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-8">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${u.rol === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-600'}`}>{u.rol.toUpperCase()}</span>
                    </td>
                    <td className="py-4 px-8 text-right">
                      <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE REGISTRO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Registrar Nuevo Usuario</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleRegistro} className="p-6 space-y-4">
              {registroMsg.texto && <div className={`p-3 rounded-xl text-xs font-bold border ${registroMsg.tipo === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{registroMsg.texto}</div>}
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">Nombre Completo</label>
                  <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900" value={formData.nombre_completo} onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">Correo Institucional</label>
                  <input required type="email" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900" value={formData.correo} onChange={(e) => setFormData({...formData, correo: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">Rol</label>
                    <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900" value={formData.rol} onChange={(e) => setFormData({...formData, rol: e.target.value})}>
                      <option value="estudiante">Estudiante</option>
                      <option value="docente">Docente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">Contraseña</label>
                    <input required type="password" placeholder="••••••" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-900" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>
              </div>

              <button disabled={creando} className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50 mt-4 shadow-lg shadow-gray-200">
                {creando ? 'Creando...' : 'Confirmar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}