import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarView() {
  // Eventos de prueba simulando reservas
  const mockEvents = [
    {
      title: 'Lab. Sistemas Operativos',
      start: new Date().setHours(10, 0, 0, 0),
      end: new Date().setHours(12, 0, 0, 0),
      backgroundColor: '#374151', // Gris oscuro
      borderColor: '#374151'
    },
    {
      title: 'Auditorio Principal',
      start: new Date().setHours(14, 0, 0, 0),
      end: new Date().setHours(16, 0, 0, 0),
      backgroundColor: '#6b7280', // Gris medio
      borderColor: '#6b7280'
    }
  ];

  return (
    <div className="w-full">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día'
        }}
        slotMinTime="07:00:00" // Horario típico universitario
        slotMaxTime="22:00:00"
        allDaySlot={false}
        height="600px"
        events={mockEvents}
        locale="es"
      />
    </div>
  );
}