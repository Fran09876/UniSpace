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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-900">
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 md:p-12 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-xl">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
            Bienvenido a UniSpace
          </h2>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            Tu plataforma centralizada para la gestión de laboratorios y espacios académicos en el TecNM.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('calendario')}
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-gray-200"
            >
              Nueva Reserva
            </button>
            <button
              onClick={() => onNavigate('reservas')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Ver Mis Reservas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState('inicio');

  const pageTitles = {
    inicio: 'Panel de Control',
    calendario: 'Calendario de Espacios',
    reservas: 'Mis Reservas',
  };

  // Nueva función para manejar el cierre de sesión real
  const handleLogout = () => {
    // 1. Eliminamos el token de sesión del almacenamiento local
    localStorage.removeItem('token');
    
    // 2. Redirigimos al Login eliminando la posibilidad de volver atrás en el historial
    navigate('/', { replace: true });
  };

  const userData = JSON.parse(localStorage.getItem('user')) || { nombre: 'Invitado', rol: 'Usuario' };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-all duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:-ml-72'
        }`}
      >
        <div className="h-20 flex items-center px-8 border-b border-gray-50">
          <div className="w-10 h-10 bg-gray-900 rounded-xl mr-4 flex items-center justify-center shadow-lg">
            <div className="w-5 h-5 bg-white rounded-full opacity-20 animate-pulse"></div>
          </div>
          <span className="font-bold text-2xl tracking-tighter uppercase italic">UniSpace</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all group ${
                view === item.id
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`w-5 h-5 mr-4 transition-transform group-hover:scale-110 ${
                  view === item.id ? 'text-white' : 'text-gray-400'
                }`}
              />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50 space-y-4">
          <div className="flex items-center px-2">
            <div className="w-11 h-11 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 font-bold shadow-sm">
              FP
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{userData.nombre}</p>
            <p className="text-xs font-medium text-gray-500">{userData.rol}</p>
            </div>
          </div>
          {/* Botón de cerrar sesión actualizado */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-red-600 bg-red-50 rounded-2xl hover:bg-red-100 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-6 sm:px-10 gap-4 sticky top-0 z-40">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors shadow-sm bg-white border border-gray-100"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">{pageTitles[view]}</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 sm:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {view === 'inicio' && <InicioView onNavigate={setView} />}
            {view === 'calendario' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CalendarView />
              </div>
            )}
            {view === 'reservas' && (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Historial de Reservas</h3>
                <p className="text-gray-500">Próximamente podrás ver tus reservas aquí.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}