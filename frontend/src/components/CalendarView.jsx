// CalendarView.jsx  —  versión corregida
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { api } from '../utils/api';

// ---------------------------------------------------------------------------
// HELPERS DE FECHA/HORA
// Extraemos siempre en hora LOCAL del navegador para evitar desfases UTC.
// ---------------------------------------------------------------------------
const toLocalDateStr = (isoStr) => {
  // isoStr puede ser "2025-07-10T09:00:00" (sin Z) → local
  // o "2025-07-10T09:00:00-06:00" → ajustar
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toLocalTimeStr = (isoStr) => {
  if (!isoStr) return '00:00';
  const d = new Date(isoStr);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
};

const fmtDisplay = (isoStr, type) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (type === 'date') {
    return d.toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// ---------------------------------------------------------------------------
// MODAL DE NUEVA SOLICITUD
// ---------------------------------------------------------------------------
function ReservationModal({ selectInfo, recursos, onClose, onConfirm }) {
  const [proposito, setProposito] = useState('');
  const [idRecurso, setIdRecurso] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async () => {
    if (!proposito.trim()) { setError('El propósito es requerido.'); return; }
    if (!idRecurso)         { setError('Selecciona un espacio.'); return; }
    setLoading(true);
    setError('');
    await onConfirm({ proposito, idRecurso });
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Nueva Solicitud de Espacio</h3>
            <p className="text-xs text-gray-400 mt-0.5">Requiere aprobación del administrador</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del bloque seleccionado */}
        <div className="mx-6 mt-5 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <p className="text-sm text-gray-600 capitalize">
              {fmtDisplay(selectInfo?.startStr, 'date')}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <p className="text-sm text-gray-600">
              {fmtDisplay(selectInfo?.startStr, 'time')} – {fmtDisplay(selectInfo?.endStr, 'time')}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Espacio a reservar</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={idRecurso}
                onChange={(e) => setIdRecurso(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none"
              >
                <option value="">— Selecciona un espacio —</option>
                {recursos.filter((r) => r.estado === 'disponible').map((r) => (
                  <option key={r.id_recurso} value={r.id_recurso}>
                    {r.nombre} · {r.tipo} (Cap. {r.capacidad})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Propósito de la reserva</label>
            <textarea
              value={proposito}
              onChange={(e) => setProposito(e.target.value)}
              placeholder="Ej: Práctica de enrutamiento OSPF, Proyecto Final..."
              rows={3}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TOOLTIP DE EVENTO
// ---------------------------------------------------------------------------
function EventTooltip({ event, position, onClose }) {
  if (!event) return null;
  const { estado, proposito, usuario, recurso } = event.extendedProps;
  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-60 animate-in fade-in zoom-in-95 duration-150"
      style={{
        top:  position.y + 8,
        left: Math.min(position.x - 120, window.innerWidth - 256),
      }}
    >
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500">
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-start gap-2 mb-2 pr-5">
        <p className="text-sm font-bold text-gray-900 leading-tight">{recurso}</p>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
          estado === 'confirmada'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-yellow-50 border-yellow-200 text-yellow-700'
        }`}>
          {estado?.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-gray-500 italic mb-1.5">"{proposito}"</p>
      {usuario && <p className="text-xs text-gray-400">👤 {usuario}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
export default function CalendarView() {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const calendarRef = useRef(null);

  const [recursos,   setRecursos]   = useState([]);
  const [eventos,    setEventos]    = useState([]);
  const [selectInfo, setSelectInfo] = useState(null);
  const [tooltip,    setTooltip]    = useState({ event: null, position: { x: 0, y: 0 } });
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Cargar espacios disponibles para el selector del modal
  useEffect(() => {
    api.get('/recursos')
      .then((r) => r.json())
      .then(setRecursos)
      .catch(() => showToast('No se pudieron cargar los espacios disponibles.', 'error'));
  }, []);

  // Cargar todos los eventos del calendario
  const cargarEventos = async () => {
    try {
      const res = await api.get('/reservas/calendario');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detalle || err.mensaje || 'Error del servidor');
      }
      setEventos(await res.json());
    } catch (err) {
      showToast(`Error al cargar el calendario: ${err.message}`, 'error');
    }
  };

  useEffect(() => { cargarEventos(); }, []);

  const handleDateSelect = (info) => {
    // Verificar que el bloque tiene hora (timeGrid), no es un día completo
    if (info.allDay) {
      showToast('Selecciona un bloque de hora en la vista Semana o Día.', 'error');
      return;
    }
    setTooltip({ event: null, position: { x: 0, y: 0 } });
    setSelectInfo(info);
  };

  const handleEventClick = (info) => {
    const rect = info.el.getBoundingClientRect();
    setTooltip({
      event:    info.event,
      position: { x: rect.left + rect.width / 2, y: rect.bottom + window.scrollY },
    });
  };

  const handleConfirm = async ({ proposito, idRecurso }) => {
    // ── CORRECCIÓN CRÍTICA DE ZONA HORARIA ──────────────────────────────────
    // Usamos las helpers locales en vez de split('T') para evitar bugs UTC.
    const fecha      = toLocalDateStr(selectInfo.startStr);
    const hora_inicio = toLocalTimeStr(selectInfo.startStr);
    const hora_fin    = toLocalTimeStr(selectInfo.endStr);
    // ────────────────────────────────────────────────────────────────────────

    if (!fecha || hora_inicio === '00:00' && hora_fin === '00:00') {
      showToast('No se pudo leer el horario seleccionado. Intenta de nuevo.', 'error');
      return;
    }

    const nuevaReserva = {
      id_usuario:  user.id,
      id_recurso:  idRecurso,
      fecha,
      hora_inicio,
      hora_fin,
      proposito,
    };

    try {
      const res  = await api.post('/reservas/crear', nuevaReserva);
      const data = await res.json();
      if (res.ok) {
        showToast(data.mensaje);
        await cargarEventos();
        setSelectInfo(null);
      } else {
        showToast(data.mensaje || 'Error al crear la reserva.', 'error');
      }
    } catch {
      showToast('Error de conexión con el servidor.', 'error');
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[60] px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl animate-in slide-in-from-top-3 duration-300 max-w-sm ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {selectInfo && (
        <ReservationModal
          selectInfo={selectInfo}
          recursos={recursos}
          onClose={() => setSelectInfo(null)}
          onConfirm={handleConfirm}
        />
      )}

      {tooltip.event && (
        <EventTooltip
          event={tooltip.event}
          position={tooltip.position}
          onClose={() => setTooltip({ event: null, position: { x: 0, y: 0 } })}
        />
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600 shrink-0" /> Confirmada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" /> Pendiente
        </span>
        <span className="text-gray-400">Selecciona un bloque de hora para solicitar un espacio</span>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left:   'prev,next today',
          center: 'title',
          right:  'timeGridWeek,timeGridDay',
        }}
        buttonText={{ today: 'Hoy', week: 'Semana', day: 'Día' }}
        selectable={true}
        selectMirror={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        events={eventos}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        height="auto"
        locale="es"
        // ── CORRECCIÓN: sin timeZone para que FullCalendar use local del navegador ──
        // Eliminar timeZone="local" que en algunas versiones de FullCalendar causa
        // que startStr lleve offset "+00:00" y se confunda con UTC.
        selectConstraint={{ startTime: '07:00', endTime: '21:00' }}
      />
    </div>
  );
}