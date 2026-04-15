import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CalendarView from './CalendarView';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState('inicio'); // Estado para controlar la vista actual

  const navigation = [
    { id: 'inicio', name: 'Inicio', icon: (/* icono inicio */) },
    { id: 'calendario', name: 'Calendario', icon: (/* icono calendario */) },
    { id: 'reservas', name: 'Mis Reservas', icon: (/* icono reservas */) },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-64'}`}>
        {/* ... (Logo UniSpace) */}

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)} // Cambiamos la vista al hacer clic
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${view === item.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* Perfil y Botón Cerrar Sesión */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">FP</div>
              <div className="ml-2">
                <p className="text-xs font-bold">Francisco Perez</p>
                <p className="text-[10px] text-gray-500">8vo Semestre</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')} // Regresa al Login
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <h1 className="text-xl font-semibold capitalize">{view}</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {/* Renderizado condicional según el estado 'view' */}
          {view === 'inicio' ? (
            <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center">
              <h2 className="text-2xl font-bold mb-4">Bienvenido al Panel de Control</h2>
              <p className="text-gray-500 mb-8">Gestiona tus reservas de manera sencilla.</p>
              <button onClick={() => setView('calendario')} className="bg-gray-900 text-white px-6 py-2 rounded-lg">Ir al Calendario</button>
            </div>
          ) : view === 'calendario' ? (
            <CalendarView />
          ) : (
            <div className="text-center py-20">Sección de Reservas en desarrollo</div>
          )}
        </main>
      </div>
    </div>
  );
}