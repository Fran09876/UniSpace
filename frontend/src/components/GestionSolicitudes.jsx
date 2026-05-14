import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Check, X, Clock, User, MapPin, RefreshCw,
  ClipboardList, Calendar, AlertCircle,
  UserCheck, GraduationCap,
  Search, Filter
} from 'lucide-react';
import { api } from '../utils/api';

const PRIORIDAD_CONFIG = {
  docente:    { label: 'Alta',   nivel: 2, Icon: UserCheck,     classes: 'bg-blue-50 border-blue-200 text-blue-700'       },
  estudiante: { label: 'Normal', nivel: 1, Icon: GraduationCap, classes: 'bg-gray-50 border-gray-200 text-gray-500'       },
};

const fmt = {
  date: (d) => d
    ? new Date(d).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    : '—',
  time: (t) => t ? String(t).substring(0, 5) : '—',
};

const safeJson = async (res) => {
  try { return await res.json(); } catch { return {}; }
};

function SolicitudCard({ req, isProcessing, onAction }) {
  const rol    = req.Usuario?.rol || 'estudiante';
  const priCfg = PRIORIDAD_CONFIG[rol] || PRIORIDAD_CONFIG.estudiante;

  return (
    <div className={`bg-white border rounded-2xl p-5 transition-all ${
      isProcessing
        ? 'opacity-60 pointer-events-none'
        : req.tiene_conflicto
        ? 'border-amber-200 shadow-sm'
        : 'border-gray-200 hover:shadow-sm'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">

        {/* ── Información ── */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-sm font-bold text-gray-900">
              {req.Recurso?.nombre ?? 'Espacio'}
            </h3>
            <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200">
              Pendiente
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${priCfg.classes}`}>
              <priCfg.Icon className="w-3 h-3" />
              Prioridad {priCfg.label}
            </span>
            {req.tiene_conflicto && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full">
                <AlertCircle className="w-3 h-3" />
                Conflicto detectado
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 italic mb-3 truncate">"{req.proposito}"</p>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="font-medium text-gray-700">{req.Usuario?.nombre_completo}</span>
              <span className="text-xs text-gray-400">({req.Usuario?.correo})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {fmt.date(req.fecha)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {fmt.time(req.hora_inicio)} – {fmt.time(req.hora_fin)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {req.Recurso?.tipo}
            </span>
          </div>

          {req.tiene_conflicto && (
            <p className="mt-2.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-100">
              ⚠ Al confirmar esta solicitud, las demás en este bloque de conflicto se rechazarán automáticamente.
            </p>
          )}
        </div>

        {/* ── Acciones ── */}
        <div className="flex lg:flex-col gap-2 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-5 shrink-0">
          <button
            onClick={() => onAction(req.id_reserva, 'confirmada')}
            disabled={isProcessing}
            className="relative flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex-1 lg:flex-none lg:w-32"
          >
            <RefreshCw
              className={`w-4 h-4 absolute left-3 transition-opacity duration-150 ${
                isProcessing ? 'opacity-100 animate-spin' : 'opacity-0'
              }`}
            />
            <Check
              className={`w-4 h-4 transition-opacity duration-150 ${
                isProcessing ? 'opacity-0' : 'opacity-100'
              }`}
            />
            Confirmar
          </button>

          <button
            onClick={() => onAction(req.id_reserva, 'cancelada', true)}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50 flex-1 lg:flex-none lg:w-32"
          >
            <X className="w-4 h-4" />
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GestionSolicitudes() {
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState(null);
  const [toast,      setToast]      = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('todos');

  const [cancelModal, setCancelModal] = useState({ mostrar: false, idReserva: null, motivo: '' });
  const [cancelandoConMotivo, setCancelandoConMotivo] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get('/reservas/pendientes');
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err.detalle || err.mensaje || `Error del servidor (${res.status})`);
      }
      const data = await safeJson(res);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err.message || 'No se pudo conectar con el servidor.');
      showToast(`Error al cargar: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAction = async (idReserva, nuevoEstado, pedirMotivo = false, motivoDirecto = null) => {
    if (nuevoEstado === 'cancelada' && pedirMotivo) {
      setCancelModal({ mostrar: true, idReserva, motivo: '' });
      return;
    }

    setProcessing(idReserva);
    try {
      const payload = { nuevoEstado };
      if (nuevoEstado === 'cancelada' && motivoDirecto) {
        payload.motivo_cancelacion = motivoDirecto;
      }

      const res  = await api.post(`/reservas/gestionar/${idReserva}`, payload);
      const data = await safeJson(res);
      if (res.ok) {
        const label = nuevoEstado === 'confirmada' ? 'confirmada' : 'rechazada';
        const extra = data.canceladas > 0
          ? ` Se cancelaron ${data.canceladas} solicitud(es) en conflicto.`
          : '';
        showToast(`✓ Reserva ${label}.${extra}`);
      } else {
        showToast(data.mensaje || `Error del servidor (${res.status}).`, 'error');
      }
    } catch (err) {
      showToast(`Error de conexión: ${err.message || 'sin respuesta.'}`, 'error');
    } finally {
      setProcessing(null);
      setCancelandoConMotivo(false);
      await fetchRequests();
    }
  };

  // --- Lógica de Agrupación por Conflicto ---
  const { conflictGroups, singles } = useMemo(() => {
    const filtered = requests.filter((req) => {
      const searchString = `${req.Usuario?.nombre_completo || ''} ${req.Recurso?.nombre || ''} ${req.proposito || ''}`.toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'todos' || req.Usuario?.rol === filterPriority;
      return matchesSearch && matchesPriority;
    });

    const groups = {};
    const individual = [];

    filtered.forEach(req => {
      if (req.tiene_conflicto) {
        // Agrupamos por ID del recurso y Fecha para identificar la "pelea" por el espacio
        const key = `${req.id_recurso}-${req.fecha}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(req);
      } else {
        individual.push(req);
      }
    });

    return {
      conflictGroups: Object.values(groups),
      singles: individual
    };
  }, [requests, searchTerm, filterPriority]);

  return (
    <div className="animate-in fade-in duration-500 relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl animate-in slide-in-from-top-3 duration-300 max-w-sm ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Solicitudes Pendientes</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {loading
              ? 'Cargando...'
              : fetchError
              ? 'Error al cargar solicitudes'
              : `${conflictGroups.flat().length + singles.length} solicitudes por gestionar`}
          </p>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white/50 backdrop-blur-md p-4 rounded-[28px] border border-gray-200 shadow-sm">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por usuario, espacio o propósito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400 font-medium"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 outline-none transition-all appearance-none cursor-pointer font-bold text-gray-700"
            >
              <option value="todos">Prioridad: Todas</option>
              <option value="docente">Solo Docentes (Alta)</option>
              <option value="estudiante">Solo Estudiantes (Normal)</option>
            </select>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Estados de Carga y Error */}
      {loading && <div className="text-center py-20 text-gray-400">Cargando solicitudes...</div>}
      
      {!loading && fetchError && (
        <div className="bg-white rounded-2xl border border-red-100 p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold">No se pudieron cargar las solicitudes</p>
          <button onClick={fetchRequests} className="mt-4 px-5 py-2 bg-gray-900 text-white rounded-xl text-sm">Reintentar</button>
        </div>
      )}

      {/* --- SECCIÓN: CONFLICTOS AGRUPADOS --- */}
      {!loading && !fetchError && conflictGroups.length > 0 && (
        <div className="mb-10 space-y-8">
          <div className="flex items-center gap-2 px-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-black text-amber-800 uppercase tracking-widest">
              Solicitudes en Conflicto Requeridas
            </h3>
          </div>

          {conflictGroups.map((grupo, idx) => (
            <div key={idx} className="bg-amber-50/30 border border-amber-100 rounded-[32px] p-6 space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full uppercase">
                  Grupo de conflicto #{idx + 1}
                </span>
                <span className="text-sm font-medium text-amber-900">
                  {grupo[0].Recurso?.nombre} — {fmt.date(grupo[0].fecha)}
                </span>
              </div>
              <div className="grid gap-3">
                {grupo.map((req) => (
                  <SolicitudCard
                    key={req.id_reserva}
                    req={req}
                    isProcessing={processing === req.id_reserva}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SECCIÓN: SOLICITUDES REGULARES --- */}
      {!loading && !fetchError && (
        <div className="space-y-4">
          {conflictGroups.length > 0 && (
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2 mb-4">
              Otras Solicitudes
            </h3>
          )}
          
          {singles.length > 0 ? (
            singles.map((req) => (
              <SolicitudCard
                key={req.id_reserva}
                req={req}
                isProcessing={processing === req.id_reserva}
                onAction={handleAction}
              />
            ))
          ) : conflictGroups.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
              <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">No hay solicitudes pendientes.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Cancelación con Motivo */}
      {cancelModal.mostrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const motivoActual = cancelModal.motivo.trim();
              if (!motivoActual) return;
              setCancelandoConMotivo(true);
              setCancelModal({ mostrar: false, idReserva: null, motivo: '' });
              await handleAction(cancelModal.idReserva, 'cancelada', false, motivoActual);
            }}
            className="w-full max-w-md bg-white rounded-[28px] shadow-2xl p-8 space-y-5"
          >
            <div>
              <h3 className="text-xl font-bold text-gray-900">Rechazar solicitud</h3>
              <p className="text-sm text-gray-500 mt-1">Ingresa el motivo del rechazo para notificar al usuario.</p>
            </div>
            <textarea
              value={cancelModal.motivo}
              onChange={(e) => setCancelModal({ ...cancelModal, motivo: e.target.value })}
              placeholder="Ej. El espacio no está disponible por evento interno..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows="4"
              required
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCancelModal({ mostrar: false, idReserva: null, motivo: '' })}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-2xl hover:bg-gray-200"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={cancelandoConMotivo || !cancelModal.motivo.trim()}
                className="flex-1 px-4 py-3 text-sm font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 disabled:opacity-50"
              >
                {cancelandoConMotivo ? 'Enviando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}