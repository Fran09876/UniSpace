import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { X, Calendar, Clock } from 'lucide-react';
import { api } from '../utils/api';

const PROPOSITO_EJEMPLO = 'Ej: Clase de programación orientada a objetos';

const toLocalDateStr = (isoStr) => {
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

function ReservationModal({ selectInfo, recursos, onClose, onConfirm }) {
  const [proposito,   setProposito]   = useState('');
  const [idRecurso,   setIdRecurso]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  // FIX: controla si se muestra el texto de ejemplo en el textarea
  const [showEjemplo, setShowEjemplo] = useState(true);

  const handleFocusProposito = () => {
    // Al hacer clic, quita el texto de ejemplo para que el usuario escriba
    if (showEjemplo) setShowEjemplo(false);
  };

  const handleBlurProposito = () => {
    // Si deja el campo vacío al salir, vuelve a mostrar el ejemplo
    if (!proposito.trim()) setShowEjemplo(true);
  };

  const handleChangeProposito = (e) => {
    setProposito(e.target.value);
    setError('');
  };

  const handleSubmit = async () => {
    if (!proposito.trim()) { setError('El propósito es requerido.'); return; }
    if (!idRecurso)         { setError('Selecciona un espacio.'); return; }
    setLoading(true);
    setError('');
    try {
      await onConfirm({ proposito, idRecurso });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Nueva Solicitud de Espacio</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-6 mt-5 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <p className="text-sm text-gray-600 capitalize">{fmtDisplay(selectInfo?.startStr, 'date')}</p>
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
            <select
              value={idRecurso}
              onChange={(e) => setIdRecurso(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none"
            >
              <option value="">— Selecciona un espacio —</option>
              {recursos.filter(r => r.estado === 'disponible').map(r => (
                <option key={r.id_recurso} value={r.id_recurso}>{r.nombre} · {r.tipo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Propósito</label>
            {/*
              FIX: textarea con ejemplo visual auto-limpiable.
              - Cuando showEjemplo=true: el texto del textarea está vacío y se superpone
                un párrafo de ejemplo en gris (pointer-events-none).
              - Al hacer clic (onFocus), el overlay desaparece y el usuario escribe.
              - Si sale sin escribir (onBlur), el overlay vuelve.
            */}
            <div className="relative">
              <textarea
                value={proposito}
                onChange={handleChangeProposito}
                onFocus={handleFocusProposito}
                onBlur={handleBlurProposito}
                rows={3}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-gray-900 outline-none resize-none"
              />
              {showEjemplo && (
                <p
                  className="absolute top-2.5 left-3.5 right-3.5 text-sm text-gray-400 pointer-events-none select-none leading-snug"
                  aria-hidden="true"
                >
                  {PROPOSITO_EJEMPLO}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventTooltip({ event, position, onClose }) {
  if (!event) return null;
  const { estado, proposito, usuario, recurso } = event.extendedProps;
  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-60 animate-in fade-in zoom-in-95 duration-150"
      style={{ top: position.y + 8, left: Math.min(position.x - 120, window.innerWidth - 256) }}
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

export default function CalendarView({ isSidebarOpen }) {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const calendarRef  = useRef(null);
  const containerRef = useRef(null);

  const [recursos,   setRecursos]   = useState([]);
  const [eventos,    setEventos]    = useState([]);
  const [selectInfo, setSelectInfo] = useState(null);
  const [tooltip,    setTooltip]    = useState({ event: null, position: { x: 0, y: 0 } });
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      calendarRef.current?.getApi().updateSize();
    }, 310);
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  useEffect(() => {
    const obs = new ResizeObserver(() => {
      setTimeout(() => calendarRef.current?.getApi().updateSize(), 310);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    api.get('/recursos').then(r => r.json()).then(setRecursos).catch(() => {});
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      const res = await api.get('/reservas/calendario');
      if (res.ok) setEventos(await res.json());
    } catch {
      showToast('Error al cargar el calendario', 'error');
    }
  };

  const handleDateSelect = (info) => {
    if (info.allDay) return;
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
    const fecha       = toLocalDateStr(selectInfo.startStr);
    const hora_inicio = toLocalTimeStr(selectInfo.startStr);
    const hora_fin    = toLocalTimeStr(selectInfo.endStr);
    try {
      const res  = await api.post('/reservas/crear', {
        id_usuario: user.id, id_recurso: idRecurso,
        fecha, hora_inicio, hora_fin, proposito,
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.mensaje);
        setSelectInfo(null);
      } else {
        showToast(data.mensaje || 'Error al crear la reserva.', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      await cargarEventos();
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm relative animate-in fade-in duration-500"
    >
      {toast && (
        <div className={`fixed top-5 right-5 z-[60] px-5 py-3 rounded-2xl text-sm font-semibold shadow-xl animate-in slide-in-from-top-3 duration-300 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
        } text-white`}>
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

      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Confirmada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pendiente
        </span>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' }}
        buttonText={{ today: 'Hoy', week: 'Semana', day: 'Día' }}
        selectable
        selectMirror
        select={handleDateSelect}
        eventClick={handleEventClick}
        events={eventos}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        
        // --- AQUÍ ESTÁ LA MAGIA PARA LOS MÓDULOS DE 1 HORA ---
        slotDuration="01:00:00" 
        slotLabelInterval="01:00"
        // ----------------------------------------------------
        
        allDaySlot={false}
        height="auto"
        locale="es"
        expandRows
        handleWindowResize
      />
    </div>
  );
}