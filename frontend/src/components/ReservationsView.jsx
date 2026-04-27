import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin,
  CheckCircle, Clock3, XCircle,
  RefreshCw, BookMarked,
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
};

export default function ReservationsView({ onNavigate }) {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [canceling,    setCanceling]    = useState(null);

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
      const res = await api.post(`/reservas/gestionar/${idReserva}`, { nuevoEstado: 'cancelada' });
      if (res.ok) {
        setReservations((prev) =>
          prev.map((r) =>
            r.id_reserva === idReserva ? { ...r, estado: 'cancelada' } : r
          )
        );
      } else {
        alert('No se pudo cancelar la reserva. Intenta de nuevo.');
      }
    } catch {
      alert('Error de conexión al intentar cancelar.');
    } finally {
      setCanceling(null);
    }
  };

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

  // --- ESTADO DE CARGA ---
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {/* Lista vacía */}
      {reservations.length === 0 && !error ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BookMarked className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">No tienes reservas aún</p>
          <p className="text-sm text-gray-400 mb-6">
            Selecciona un horario en el calendario para solicitar un espacio.
          </p>
          {onNavigate && (
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
          {reservations.map((res) => {
            const cfg        = STATUS_CONFIG[res.estado] || STATUS_CONFIG.pendiente;
            const canCancel  = res.estado === 'pendiente';
            const isCanceling = canceling === res.id_reserva;

            return (
              <div
                key={res.id_reserva}
                className={`bg-white border rounded-xl p-6 transition-all ${
                  res.estado === 'cancelada'
                    ? 'border-gray-100 opacity-60'
                    : 'border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {res.Recurso?.nombre ?? 'Espacio'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${cfg.classes}`}>
                        <cfg.Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 italic truncate">
                      "{res.proposito}"
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
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
                  </div>

                  {/* Acción: cancelar solo si está pendiente */}
                  {canCancel && (
                    <div className="flex md:flex-col gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 shrink-0">
                      <button
                        onClick={() => handleCancel(res.id_reserva)}
                        disabled={isCanceling}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-transparent rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {isCanceling ? 'Cancelando...' : 'Cancelar'}
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