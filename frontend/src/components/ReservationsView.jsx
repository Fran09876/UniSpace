import React from 'react';
import { Calendar, Clock, MapPin, CheckCircle, Clock3 } from 'lucide-react';

export default function ReservationsView() {
  // Datos simulados de tus reservas
  const reservations = [
    {
      id: 1,
      resource: 'Laboratorio de Cómputo B',
      purpose: 'Práctica de enrutamiento OSPF y EIGRP',
      date: '18 de Abril, 2026',
      time: '10:00 AM - 12:00 PM',
      status: 'confirmada'
    },
    {
      id: 2,
      resource: 'Auditorio de Sistemas',
      purpose: 'Presentación del proyecto UniSpace',
      date: '25 de Abril, 2026',
      time: '14:00 PM - 16:00 PM',
      status: 'pendiente'
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto font-sans">
      
      {/* Cabecera de la sección */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Reservas</h2>
          <p className="text-gray-500 mt-1">Gestiona el historial y estado de tus espacios solicitados.</p>
        </div>
        <button className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors shadow-sm">
          + Nueva Reserva
        </button>
      </div>

      {/* Lista de Reservas */}
      <div className="space-y-4">
        {reservations.map((res) => (
          <div key={res.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Información principal */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{res.resource}</h3>
                  
                  {/* Etiqueta de estado (Badge) minimalista */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                    res.status === 'confirmada' 
                      ? 'bg-gray-50 border-gray-900 text-gray-900' 
                      : 'bg-gray-50 border-gray-300 text-gray-500'
                  }`}>
                    {res.status === 'confirmada' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock3 className="w-3.5 h-3.5" />}
                    <span className="capitalize">{res.status}</span>
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{res.purpose}</p>
                
                {/* Detalles con iconos */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{res.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{res.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>Edificio Principal</span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex md:flex-col gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">
                  Modificar
                </button>
                <button className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-transparent rounded-lg hover:bg-red-100 transition-colors">
                  Cancelar
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}