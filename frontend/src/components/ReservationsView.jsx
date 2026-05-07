import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, MapPin,
  CheckCircle, Clock3, XCircle,
  RefreshCw, BookMarked, Search,
  Filter, CalendarDays, History
} from 'lucide-react';
import { api } from '../utils/api';

const STATUS_CONFIG = {
  confirmada: {
    label: 'Confirmada',
    Icon: CheckCircle,
    classes: 'bg-green-50 border-green-200 text-green-700',
  },
  pendiente: {
    label: 'Pendiente',
    Icon: Clock3,
    classes: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  },
  cancelada: {
    label: 'Cancelada',
    Icon: XCircle,
    classes: 'bg-red-50 border-red-200 text-red-500',
  },
  expirada: {
    label: 'Expirada',
    Icon: History,
    classes: 'bg-gray-50 border-gray-200 text-gray-500',
  }
};

export default function ReservationsView({ onNavigate }) {
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // --- Estados ---
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(null);

  // --- Estados de Filtros ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  // 🔥 VALIDACIÓN: Administradores no pueden ver "Mis Reservas"
  if (user.rol === 'admin') {
    return (
      <div className="w-full max-w-5xl mx-auto font-sans">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BookMarked className="w-7 h-7 text-yellow-600" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">Acceso restringido</p>
          <p className="text-sm text-gray-500 mb-6">
            Los administradores no pueden solicitar reservas. Utiliza la sección "Solicitudes" para gestionar las solicitudes de otros usuarios.
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate('gestion_admin')}
              className="px-5 py-2.5 bg-yellow-600 text-white text-sm font-semibold rounded-xl hover:bg-yellow-700 transition-colors"
            >
              Ir a Solicitudes
            </button>
          )}
        </div>
      </div>
    );
  }

  const fetchReservations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/reservas/usuario/${user.id}`);
      if (!res.ok) throw new Error('No autorizado');
      const data = await res.json();
      setReservations(data);
    } catch {
      setError('No se pudieron cargar tus reservas. Verifica la conexión o tu sesión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleCancel = async (idReserva) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) return;
    setCanceling(idReserva);
    try {
      // FIX: Se envía el motivo_cancelacion porque el backend lo exige para estado 'cancelada'
      const res = await api.post(`/reservas/gestionar/${idReserva}`, { 
        nuevoEstado: 'cancelada',
        motivo_cancelacion: 'Cancelada voluntariamente por el usuario.' 
      });
      
      if (res.ok) {
        setReservations((prev) =>
          prev.map((r) =>
            r.id_reserva === idReserva ? { ...r, estado: 'cancelada' } : r
          )
        );
      } else {
        const errData = await res.json();
        alert(errData.mensaje || 'No se pudo cancelar la reserva.');
      }
    } catch {
      alert('Error de conexión al intentar cancelar.');
    } finally {
      setCanceling(null);
    }
  };

  // --- Lógica de Filtrado (Memoizada para rendimiento) ---
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      const matchesSearch = 
        res.Recurso?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.proposito?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'todos' || res.estado === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, filterStatus]);

  const formatDate = (isoDate) => {
    if (!isoDate) return '—';
    const [y, m, d] = String(isoDate).substring(0, 10).split('-');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    return String(timeStr).substring(0, 5);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="text-sm font-medium">Cargando tus reservas...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto font-sans animate-in fade-in duration-500">

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Reservas</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Historial y estado de tus espacios solicitados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReservations}
            title="Actualizar"
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('calendario')}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors shadow-sm"
            >
              + Nueva Reserva
            </button>
          )}
        </div>
      </div>

      {/* --- BARRA DE BÚSQUEDA Y FILTROS PREMIUM --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white/50 backdrop-blur-md p-4 rounded-[28px] border border-gray-200 shadow-sm">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por aula, laboratorio o propósito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 outline-none transition-all placeholder:text-gray-400 font-medium"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 outline-none transition-all appearance-none cursor-pointer font-bold text-gray-700"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="confirmada">Confirmadas</option>
            <option value="cancelada">Canceladas</option>
            <option value="expirada">Expiradas</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {/* Lista vacía / No resultados */}
      {filteredReservations.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            {searchTerm || filterStatus !== 'todos' ? (
               <Search className="w-7 h-7 text-gray-400" />
            ) : (
               <BookMarked className="w-7 h-7 text-gray-400" />
            )}
          </div>
          <p className="text-gray-700 font-semibold mb-1">
            {searchTerm || filterStatus !== 'todos' ? 'No se encontraron resultados' : 'No tienes reservas aún'}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {searchTerm || filterStatus !== 'todos' 
              ? 'Prueba ajustando los filtros o el término de búsqueda.' 
              : 'Selecciona un horario en el calendario para solicitar un espacio.'}
          </p>
          {!searchTerm && filterStatus === 'todos' && onNavigate && (
            <button
              onClick={() => onNavigate('calendario')}
              className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors"
            >
              Ir al Calendario
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((res) => {
            const cfg = STATUS_CONFIG[res.estado] || STATUS_CONFIG.pendiente;
            const canCancel = res.estado === 'pendiente';
            const isCanceling = canceling === res.id_reserva;

            return (
              <div
                key={res.id_reserva}
                className={`bg-white border rounded-xl p-6 transition-all ${
                  res.estado === 'cancelada' || res.estado === 'expirada'
                    ? 'border-gray-100 opacity-60'
                    : 'border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        {res.Recurso?.nombre ?? 'Espacio'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${cfg.classes}`}>
                        <cfg.Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 italic truncate">
                      "{res.proposito}"
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        {formatDate(res.fecha)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatTime(res.hora_inicio)} – {formatTime(res.hora_fin)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {res.Recurso?.tipo ?? 'Instalación'}
                      </span>
                    </div>

                    {/* Si fue cancelada por el administrador o sistema, mostrar motivo */}
                    {res.estado === 'cancelada' && res.motivo_cancelacion && (
                      <div className="mt-3 p-2.5 bg-red-50/50 rounded-lg border border-red-100/50">
                        <p className="text-xs text-red-600">
                          <span className="font-bold">Motivo:</span> {res.motivo_cancelacion}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acción: cancelar solo si está pendiente */}
                  {canCancel && (
                    <div className="flex md:flex-col gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                      <button
                        onClick={() => handleCancel(res.id_reserva)}
                        disabled={isCanceling}
                        className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {isCanceling ? 'Cancelando...' : 'Cancelar Solicitud'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}