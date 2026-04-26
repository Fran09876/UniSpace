import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, X, RefreshCw,
  Users, CheckCircle, AlertTriangle, Package,
} from 'lucide-react';
import { api } from '../utils/api';

const TIPOS = ['Laboratorio', 'Aula', 'Auditorio', 'Sala de Reuniones', 'Taller', 'Cancha', 'Otro'];

const ESTADO_CFG = {
  disponible:    { label: 'Disponible',    Icon: CheckCircle,   classes: 'bg-green-50 border-green-200 text-green-700'   },
  mantenimiento: { label: 'Mantenimiento', Icon: AlertTriangle, classes: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
};

const TIPO_EMOJI = {
  Laboratorio: '🖥️', Aula: '🏫', Auditorio: '🎭',
  'Sala de Reuniones': '🤝', Taller: '🔧', Cancha: '⚽', Otro: '📍',
};

const FORM_EMPTY = { nombre: '', tipo: 'Laboratorio', capacidad: '', descripcion: '', estado: 'disponible' };

// --- MODAL CREAR / EDITAR ---
function RecursoModal({ recurso, onClose, onSaved }) {
  const [form,    setForm]    = useState(
    recurso
      ? { nombre: recurso.nombre, tipo: recurso.tipo, capacidad: recurso.capacidad,
          descripcion: recurso.descripcion || '', estado: recurso.estado }
      : FORM_EMPTY
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!form.tipo)           { setError('El tipo es obligatorio.'); return; }
    setLoading(true);
    try {
      const res = recurso
        ? await api.put(`/recursos/${recurso.id_recurso}`, form)
        : await api.post('/recursos', form);
      const data = await res.json();
      if (res.ok) {
        onSaved(data.recurso);
      } else {
        setError(data.mensaje || 'Error al guardar.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {recurso ? 'Editar Espacio' : 'Nuevo Espacio'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {recurso ? 'Modifica los datos del recurso.' : 'El recurso quedará disponible para reservas de inmediato.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del espacio *</label>
              <input
                type="text" name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Ej: Laboratorio de Cómputo A"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo *</label>
              <select
                name="tipo" value={form.tipo} onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacidad (personas)</label>
              <input
                type="number" name="capacidad" value={form.capacidad} onChange={handleChange}
                placeholder="30" min="0"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción (opcional)</label>
              <textarea
                name="descripcion" value={form.descripcion} onChange={handleChange}
                placeholder="Ej: 20 PCs con Cisco Packet Tracer, proyector, A/C..."
                rows={2}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <div className="flex gap-3">
                {Object.entries(ESTADO_CFG).map(([val, cfg]) => (
                  <label
                    key={val}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-all ${
                      form.estado === val
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input type="radio" name="estado" value={val} checked={form.estado === val}
                      onChange={handleChange} className="sr-only" />
                    <cfg.Icon className="w-4 h-4" />
                    {cfg.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit} disabled={loading}
              className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : recurso ? 'Guardar Cambios' : 'Crear Recurso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function GestionRecursos() {
  const [recursos,  setRecursos]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // null | 'new' | <recursoObj>
  const [deleting,  setDeleting]  = useState(null);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRecursos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/recursos');
      if (!res.ok) throw new Error();
      setRecursos(await res.json());
    } catch {
      showToast('Error al cargar los recursos.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecursos(); }, [fetchRecursos]);

  const handleSaved = (saved) => {
    setRecursos((prev) => {
      const idx = prev.findIndex((r) => r.id_recurso === saved.id_recurso);
      if (idx >= 0) {
        const arr = [...prev];
        arr[idx] = saved;
        return arr;
      }
      return [...prev, saved].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
    const wasEdit = modal && typeof modal === 'object';
    setModal(null);
    showToast(wasEdit ? '✓ Recurso actualizado.' : '✓ Recurso creado exitosamente.');
  };

  const handleDelete = async (recurso) => {
    if (!window.confirm(`¿Eliminar "${recurso.nombre}"? Esta acción es irreversible.`)) return;
    setDeleting(recurso.id_recurso);
    try {
      const res  = await api.delete(`/recursos/${recurso.id_recurso}`);
      const data = await res.json();
      if (res.ok) {
        setRecursos((prev) => prev.filter((r) => r.id_recurso !== recurso.id_recurso));
        showToast('✓ Recurso eliminado.');
      } else {
        showToast(data.mensaje || 'No se pudo eliminar.', 'error');
      }
    } catch {
      showToast('Error de conexión.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleEstado = async (recurso) => {
    const nuevo = recurso.estado === 'disponible' ? 'mantenimiento' : 'disponible';
    try {
      const res = await api.put(`/recursos/${recurso.id_recurso}`, { estado: nuevo });
      if (res.ok) {
        setRecursos((prev) =>
          prev.map((r) => r.id_recurso === recurso.id_recurso ? { ...r, estado: nuevo } : r)
        );
        showToast(`Estado actualizado a "${nuevo}".`);
      }
    } catch {
      showToast('Error al cambiar el estado.', 'error');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 relative">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl animate-in slide-in-from-top-3 duration-300 ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {modal !== null && (
        <RecursoModal
          recurso={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Recursos</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? 'Cargando...' : `${recursos.length} espacio(s) registrado(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRecursos} disabled={loading}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setModal('new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Espacio
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-400 gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Cargando recursos...</span>
        </div>
      )}

      {!loading && recursos.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Package className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">No hay espacios registrados</p>
          <p className="text-sm text-gray-400 mb-6">
            Crea el primer recurso para que los usuarios puedan hacer reservas.
          </p>
          <button
            onClick={() => setModal('new')}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
          >
            Agregar Primer Espacio
          </button>
        </div>
      )}

      {!loading && recursos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recursos.map((recurso) => {
            const cfg        = ESTADO_CFG[recurso.estado] || ESTADO_CFG.disponible;
            const isDeleting = deleting === recurso.id_recurso;
            const emoji      = TIPO_EMOJI[recurso.tipo] || '📍';

            return (
              <div
                key={recurso.id_recurso}
                className={`bg-white border rounded-2xl p-5 flex flex-col gap-3 transition-all ${
                  isDeleting ? 'opacity-50 pointer-events-none' : 'border-gray-200 hover:shadow-sm'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                      {emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{recurso.nombre}</p>
                      <p className="text-xs text-gray-400">{recurso.tipo}</p>
                    </div>
                  </div>

                  {/* Badge de estado (clickeable) */}
                  <button
                    onClick={() => handleToggleEstado(recurso)}
                    title="Click para cambiar estado"
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:opacity-75 ${cfg.classes}`}
                  >
                    <cfg.Icon className="w-3 h-3" />
                    {cfg.label}
                  </button>
                </div>

                {/* Descripción */}
                {recurso.descripcion && (
                  <p className="text-xs text-gray-500 line-clamp-2">{recurso.descripcion}</p>
                )}

                {/* Capacidad */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span>Capacidad: {recurso.capacidad} personas</span>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 border-t border-gray-100 pt-3 mt-auto">
                  <button
                    onClick={() => setModal(recurso)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(recurso)}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-transparent rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}