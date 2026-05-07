import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Calendar, BookMarked, LogOut,
  Menu, X, BellRing, CheckCircle, Clock,
  MapPin, Building, Users
} from 'lucide-react';
import CalendarView      from './CalendarView';
import GestionSolicitudes from './GestionSolicitudes';
import GestionRecursos    from './GestionRecursos';
import ReservationsView   from './ReservationsView';
import GestionUsuarios    from './GestionUsuarios';
import { api }            from '../utils/api';

function InicioView({ onNavigate }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [stats, setStats] = useState({
    reservasActivas:     '—',
    proximaReserva:      '—',
    espaciosDisponibles: '—',
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user.id) {
      setLoadingStats(false);
      return;
    }

    const loadStats = async () => {
      try {
        const endpointReservas = user.rol === 'admin'
          ? '/reservas/calendario'
          : `/reservas/usuario/${user.id}`;

        const [resReservas, resRecursos] = await Promise.all([
          api.get(endpointReservas),
          api.get('/recursos'),
        ]);

        const reservas = resReservas.ok ? await resReservas.json() : [];
        const recursos  = resRecursos.ok ? await resRecursos.json()  : [];

        const activas = reservas.filter((r) => {
          const estado = r.estado || r.extendedProps?.estado;
          return estado === 'confirmada' || estado === 'pendiente';
        }).length;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const proxima = reservas
          .filter((r) => {
            const estado = r.estado || r.extendedProps?.estado;
            if (estado === 'cancelada') return false;
            const fechaStr = r.fecha || (r.start ? r.start.split('T')[0] : '');
            if (!fechaStr) return false;
            const [y, m, d] = String(fechaStr).substring(0, 10).split('-');
            return new Date(Number(y), Number(m) - 1, Number(d)) >= hoy;
          })
          .sort((a, b) => {
            const fechaA = a.fecha ? `${a.fecha}T${a.hora_inicio}` : a.start;
            const fechaB = b.fecha ? `${b.fecha}T${b.hora_inicio}` : b.start;
            return fechaA.localeCompare(fechaB);
          })[0];

        let proximaStr = 'Sin pendientes';
        if (proxima) {
          const fechaStr = proxima.fecha || (proxima.start ? proxima.start.split('T')[0] : '');
          const horaStr  = proxima.hora_inicio || (proxima.start ? proxima.start.split('T')[1].substring(0, 5) : '');
          const [y, m, d] = String(fechaStr).substring(0, 10).split('-');
          const fechaObj = new Date(Number(y), Number(m) - 1, Number(d));
          proximaStr = `${fechaObj.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })} ${String(horaStr).substring(0, 5)}`;
        }

        const disponibles = recursos.filter((r) => r.estado === 'disponible').length;

        setStats({
          reservasActivas:     activas,
          proximaReserva:      proximaStr,
          espaciosDisponibles: disponibles,
        });
      } catch (err) {
        console.error('Error cargando stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [user.id]);

  const statCards = [
    { label: 'Reservas activas',     value: stats.reservasActivas,     icon: CheckCircle },
    { label: 'Próxima reserva',      value: stats.proximaReserva,      icon: Clock       },
    { label: 'Espacios disponibles', value: stats.espaciosDisponibles, icon: MapPin      },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-900">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? (
                    <span className="inline-block w-8 h-6 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 sm:p-16 text-center">
        <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
          <Calendar className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Bienvenido a UniSpace</h2>
        <p className="text-gray-500 mb-10 max-w-sm mx-auto">
          Gestiona los espacios del IT Oaxaca de forma sencilla y eficiente.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={() => onNavigate('calendario')}
            className="px-8 py-3.5 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-black shadow-lg transition-colors"
          >
            {user.rol === 'admin' ? 'Ver Calendario' : 'Nueva Reserva'}
          </button>
          {/* FIX: el botón secundario solo aparece para no-admin */}
          {user.rol !== 'admin' && (
            <button
              onClick={() => onNavigate('reservas')}
              className="px-8 py-3.5 bg-white text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Ver Mis Reservas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const navigate  = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState('inicio');

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const nombre   = userData.nombre || 'Usuario';
  const isAdmin  = userData.rol === 'admin';

  const navigation = [
    { id: 'inicio',           name: 'Inicio',              icon: Home      },
    { id: 'calendario',       name: 'Calendario',          icon: Calendar  },
    // FIX: "Mis Reservas" solo aparece para usuarios no-admin
    ...(!isAdmin ? [
      { id: 'reservas', name: 'Mis Reservas', icon: BookMarked },
    ] : []),
    ...(isAdmin ? [
      { id: 'gestion_admin',    name: 'Solicitudes',        icon: BellRing },
      { id: 'gestion_recursos', name: 'Gestionar Espacios', icon: Building },
      { id: 'gestion_usuarios', name: 'Usuarios y Roles',   icon: Users    },
    ] : []),
  ];

  const pageTitles = {
    inicio:           'Panel de Control',
    calendario:       'Calendario de Espacios',
    reservas:         'Mis Reservas',
    gestion_admin:    'Administración de Solicitudes',
    gestion_recursos: 'Gestión de Recursos',
    gestion_usuarios: 'Gestión de Usuarios',
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/', { replace: true });
  };

  const handleNav = (id) => {
    setView(id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100
        flex flex-col transform transition-all duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-72'}`}
      >
        <div className="h-20 flex items-center px-8 border-b border-gray-50 shrink-0">

          {/* PUNTO PALPITANTE */}
          <div className="relative mr-4 flex items-center justify-center w-10 h-10">
            <span className="absolute inline-flex h-full w-full rounded-full bg-black opacity-20 animate-ping" />
            <div className="relative w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg z-10">
              <span className="h-3 w-3 bg-white rounded-full animate-pulse" />
            </div>
          </div>

          <span className="font-bold text-2xl tracking-tighter uppercase italic">UniSpace</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all ${
                view === item.id
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5 mr-4 shrink-0" />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50 space-y-4 shrink-0">
          <div className="flex items-center px-2">
            <div
              className="w-11 h-11 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold shadow-sm shrink-0"
              translate="no"
            >
              {nombre.substring(0, 2).toUpperCase()}
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate" translate="no">
                {nombre}
              </p>
              <p className="text-xs font-medium text-gray-500 uppercase">{userData.rol}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ease-in-out">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-4 sm:px-8 gap-4 sticky top-0 z-30 shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 border border-gray-100 shadow-sm bg-white transition-transform active:scale-90"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            {pageTitles[view]}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {view === 'inicio'           && <InicioView onNavigate={setView} />}
            {view === 'calendario'       && <CalendarView isSidebarOpen={isSidebarOpen} />}
            {view === 'reservas'         && <ReservationsView onNavigate={setView} />}
            {view === 'gestion_admin'    && <GestionSolicitudes />}
            {view === 'gestion_recursos' && <GestionRecursos />}
            {view === 'gestion_usuarios' && <GestionUsuarios />}
          </div>
        </main>
      </div>
    </div>
  );
}