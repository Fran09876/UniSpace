import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  BookMarked,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import CalendarView from './CalendarView';

const navigation = [
  { id: 'inicio', name: 'Inicio', icon: Home },
  { id: 'calendario', name: 'Calendario', icon: Calendar },
  { id: 'reservas', name: 'Mis Reservas', icon: BookMarked },
];

function InicioView({ onNavigate }) {
  const stats = [
    { label: 'Reservas activas', value: '3', icon: CheckCircle },
    { label: 'Próxima reserva', value: 'Hoy 14:00', icon: Clock },
    { label: 'Espacios disponibles', value: '12', icon: MapPin },
  ];

  const upcoming = [
    { space: 'Lab. Sistemas Operativos', date: 'Hoy', time: '10:00 – 12:00', status: 'Confirmada' },
    { space: 'Auditorio Principal', date: 'Hoy', time: '14:00 – 16:00', status: 'Confirmada' },
    { space: 'Sala de Cómputo B', date: 'Mañana', time: '09:00 – 11:00', status: 'Pendiente' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Welcome card */}
      <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">¡Bienvenido de nuevo, Francisco!</h2>
          <p className="text-gray-400 text-sm">Tienes 3 reservas activas esta semana.</p>
        </div>
        <button
          onClick={() => onNavigate('calendario')}
          className="flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          Ver calendario
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Upcoming reservations */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Próximas reservas</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {upcoming.map((item) => (
            <div key={item.space} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.space}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.date} · {item.time}</p>
              </div>
              <span className={`self-start sm:self-auto text-xs font-medium px-2.5 py-1 rounded-full ${
                item.status === 'Confirmada'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-yellow-50 text-yellow-700'
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReservasView() {
  const reservas = [
    { id: 1, space: 'Lab. Sistemas Operativos', date: '15 Abr 2026', time: '10:00 – 12:00', status: 'Confirmada' },
    { id: 2, space: 'Auditorio Principal', date: '15 Abr 2026', time: '14:00 – 16:00', status: 'Confirmada' },
    { id: 3, space: 'Sala de Cómputo B', date: '16 Abr 2026', time: '09:00 – 11:00', status: 'Pendiente' },
    { id: 4, space: 'Sala de Reuniones 3', date: '10 Abr 2026', time: '13:00 – 14:00', status: 'Completada' },
    { id: 5, space: 'Lab. Redes', date: '8 Abr 2026', time: '08:00 – 10:00', status: 'Completada' },
  ];

  const statusStyle = {
    Confirmada: 'bg-green-50 text-green-700',
    Pendiente: 'bg-yellow-50 text-yellow-700',
    Completada: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Historial de reservas</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {reservas.map((r) => (
          <div key={r.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{r.space}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.date} · {r.time}</p>
              </div>
            </div>
            <span className={`self-start sm:self-auto text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[r.status]}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [view, setView] = useState('inicio');

  const handleNavClick = (id) => {
    setView(id);
    setIsSidebarOpen(false); // cierra sidebar en móvil al navegar
  };

  const pageTitles = {
    inicio: 'Inicio',
    calendario: 'Calendario',
    reservas: 'Mis Reservas',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">

      {/* Overlay móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">UniSpace</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors
                ${view === id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {name}
            </button>
          ))}
        </nav>

        {/* Profile + Logout */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">
              FP
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">Francisco Perez</p>
              <p className="text-[10px] text-gray-500">8vo Semestre</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-20">
          {/* Hamburger button (only mobile) */}
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Abrir menú"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{pageTitles[view]}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {view === 'inicio' && <InicioView onNavigate={setView} />}
          {view === 'calendario' && <CalendarView />}
          {view === 'reservas' && <ReservasView />}
        </main>
      </div>
    </div>
  );
}