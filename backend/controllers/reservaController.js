// controllers/reservaController.js
const { Op } = require('sequelize');
const Reserva = require('../models/Reserva');
const Recurso = require('../models/Recurso');
const Usuario = require('../models/Usuario');
const { enviarCorreoReserva } = require('../services/emailService');

const STATUS_COLORS = {
  confirmada: '#16a34a',
  pendiente:  '#d97706',
};

const NIVEL_PRIORIDAD = { admin: 3, docente: 2, estudiante: 1 };

const formatFecha = (fecha) => {
  if (!fecha) return '';
  return String(fecha).substring(0, 10);
};

const formatHora = (hora) => {
  if (!hora) return '';
  return String(hora).substring(0, 5);
};

const marcarReservasExpiradas = async () => {
  const ahora = new Date();
  const fechaHoyStr = ahora.toISOString().substring(0, 10);
  const horaActual = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');

  await Reserva.update(
    { estado: 'expirada' },
    {
      where: {
        estado: 'confirmada',
        [Op.or]: [
          { fecha: { [Op.lt]: fechaHoyStr } },
          {
            fecha: fechaHoyStr,
            hora_fin: { [Op.lte]: horaActual }
          }
        ]
      }
    }
  );
};

const crearReserva = async (req, res) => {
  try {
    const { id_usuario, id_recurso, fecha, hora_inicio, hora_fin, proposito } = req.body;
    
    const usuario = await Usuario.findByPk(id_usuario, { attributes: ['rol'] });
    if (usuario?.rol === 'admin') {
      return res.status(403).json({ mensaje: 'Los administradores no pueden solicitar reservas.' });
    }

    if (!id_usuario || !id_recurso || !fecha || !hora_inicio || !hora_fin || !proposito) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({ mensaje: 'La hora de inicio debe ser anterior a la hora de fin.' });
    }

    const recurso = await Recurso.findByPk(id_recurso, { attributes: ['estado', 'nombre'] });
    if (!recurso) {
      return res.status(404).json({ mensaje: 'Recurso no encontrado.' });
    }
    if (recurso.estado === 'mantenimiento') {
      return res.status(409).json({ mensaje: `"${recurso.nombre}" está en mantenimiento. No se pueden hacer reservas.` });
    }

    const bloqueada = await Reserva.findOne({
      where: {
        id_recurso,
        fecha,
        estado:      'confirmada',
        hora_inicio: { [Op.lt]: hora_fin },
        hora_fin:    { [Op.gt]: hora_inicio },
      },
      include: [{ model: Recurso, attributes: ['nombre'] }],
    });

    if (bloqueada) {
      return res.status(409).json({
        mensaje: `"${bloqueada.Recurso?.nombre}" ya tiene una reserva confirmada de ${formatHora(bloqueada.hora_inicio)} a ${formatHora(bloqueada.hora_fin)}. Elige otro horario.`,
      });
    }

    const solapadasCount = await Reserva.count({
      where: {
        id_recurso,
        fecha,
        estado:      'pendiente',
        hora_inicio: { [Op.lt]: hora_fin },
        hora_fin:    { [Op.gt]: hora_inicio },
      },
    });

    const nuevaReserva = await Reserva.create({
      id_usuario, id_recurso, fecha, hora_inicio, hora_fin, proposito,
      estado: 'pendiente',
    });

    const mensaje = solapadasCount > 0
      ? `Solicitud enviada. Hay ${solapadasCount} solicitud(es) pendiente(s) para el mismo horario. El administrador decidirá según prioridad de rol.`
      : 'Solicitud enviada. Espera la aprobación del administrador.';

    res.status(201).json({ mensaje, reserva: nuevaReserva });
  } catch (error) {
    console.error('crearReserva:', error);
    res.status(500).json({ mensaje: 'Error al crear la reserva.', detalle: error.message });
  }
};

const obtenerEventosCalendario = async (req, res) => {
  try {
    await marcarReservasExpiradas();

    const reservas = await Reserva.findAll({
      where: { estado: { [Op.in]: ['pendiente', 'confirmada'] } },
      include: [
        { model: Recurso, attributes: ['nombre'] },
        { model: Usuario, attributes: ['nombre_completo'] },
      ],
    });

    const eventos = reservas.map((r) => {
      const fechaStr = formatFecha(r.fecha);
      const inicio   = formatHora(r.hora_inicio);
      const fin      = formatHora(r.hora_fin);

      return {
        id:              String(r.id_reserva),
        title:           `${r.Recurso?.nombre ?? 'Espacio'} · ${r.proposito}`,
        start:           `${fechaStr}T${inicio}`,
        end:             `${fechaStr}T${fin}`,
        backgroundColor: STATUS_COLORS[r.estado] || '#111827',
        borderColor:     STATUS_COLORS[r.estado] || '#111827',
        extendedProps: {
          estado:    r.estado,
          proposito: r.proposito,
          usuario:   r.Usuario?.nombre_completo,
          recurso:   r.Recurso?.nombre,
        },
      };
    });

    res.json(eventos);
  } catch (error) {
    console.error('obtenerEventosCalendario:', error);
    res.status(500).json({ mensaje: 'Error al obtener eventos del calendario.', detalle: error.message });
  }
};

const obtenerReservasPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    await marcarReservasExpiradas();
    
    const reservas = await Reserva.findAll({
      where: { id_usuario },
      include: [{ model: Recurso, attributes: ['nombre', 'tipo'] }],
      order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']],
    });
    res.json(reservas);
  } catch (error) {
    console.error('obtenerReservasPorUsuario:', error);
    res.status(500).json({ mensaje: 'Error al obtener las reservas.', detalle: error.message });
  }
};

const obtenerReservasPendientes = async (req, res) => {
  try {
    const reservas = await Reserva.findAll({
      where: { estado: 'pendiente' },
      include: [
        { model: Recurso, attributes: ['nombre', 'tipo'] },
        { model: Usuario, attributes: ['nombre_completo', 'correo', 'rol'] },
      ],
      order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']],
    });

    const plain = reservas.map((r) => r.toJSON());

    plain.sort((a, b) => {
      const pa = NIVEL_PRIORIDAD[a.Usuario?.rol] ?? 0;
      const pb = NIVEL_PRIORIDAD[b.Usuario?.rol] ?? 0;
      if (pb !== pa) return pb - pa;
      const fa = `${a.fecha}T${a.hora_inicio}`;
      const fb = `${b.fecha}T${b.hora_inicio}`;
      return fa.localeCompare(fb);
    });

    const conFlags = plain.map((r) => {
      const rFecha = String(r.fecha).substring(0, 10);
      const conflictos = plain.filter(
        (other) =>
          other.id_reserva !== r.id_reserva &&
          other.id_recurso === r.id_recurso &&
          String(other.fecha).substring(0, 10) === rFecha &&
          String(other.hora_inicio) < String(r.hora_fin) &&
          String(other.hora_fin)    > String(r.hora_inicio)
      );
      return {
        ...r,
        tiene_conflicto:  conflictos.length > 0,
        conflictos_count: conflictos.length,
      };
    });

    res.json(conFlags);
  } catch (error) {
    console.error('obtenerReservasPendientes:', error);
    res.status(500).json({ mensaje: 'Error al obtener solicitudes.', detalle: error.message });
  }
};

const gestionarReserva = async (req, res) => {
  try {
    const { id_reserva } = req.params;
    const { nuevoEstado, motivo_cancelacion } = req.body;

    if (!['confirmada', 'cancelada'].includes(nuevoEstado)) {
      return res.status(400).json({ mensaje: 'Estado no válido.' });
    }

    if (nuevoEstado === 'cancelada' && !motivo_cancelacion?.trim()) {
      return res.status(400).json({ mensaje: 'El motivo de cancelación es obligatorio.' });
    }

    const reserva = await Reserva.findByPk(id_reserva, {
      include: [
        { model: Usuario, attributes: ['nombre_completo', 'correo', 'rol'] },
        { model: Recurso, attributes: ['nombre'] },
      ],
    });

    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada.' });
    }
    if (reserva.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'Solo se pueden gestionar reservas en estado "pendiente".' });
    }

    reserva.estado = nuevoEstado;
    if (nuevoEstado === 'cancelada') {
      reserva.motivo_cancelacion = motivo_cancelacion;
    }
    await reserva.save();

    let canceladas = 0;

    // LÓGICA MODIFICADA: Encontrar conflictos y asignar el motivo automático
    if (nuevoEstado === 'confirmada') {
      const solicitudesEnConflicto = await Reserva.findAll({
        where: {
          id_reserva:  { [Op.ne]: id_reserva },
          id_recurso:  reserva.id_recurso,
          fecha:       reserva.fecha,
          estado:      'pendiente',
          hora_inicio: { [Op.lt]: reserva.hora_fin },
          hora_fin:    { [Op.gt]: reserva.hora_inicio },
        },
        include: [
          { model: Usuario, attributes: ['nombre_completo', 'correo'] },
          { model: Recurso, attributes: ['nombre'] }
        ]
      });

      const motivoPrioridad =
        'Su solicitud ha sido cancelada automáticamente porque se aprobó otra reserva para el mismo espacio y horario.';

      if (solicitudesEnConflicto.length > 0) {
        await Reserva.update(
          { estado: 'cancelada', motivo_cancelacion: motivoPrioridad },
          {
            where: {
              id_reserva: { [Op.in]: solicitudesEnConflicto.map((s) => s.id_reserva) }
            }
          }
        );

        for (const sol of solicitudesEnConflicto) {
          if (sol.Usuario?.correo) {
            enviarCorreoReserva({
              to: sol.Usuario.correo,
              nombre: sol.Usuario.nombre_completo,
              estado: 'cancelada',
              reserva: sol,
              motivo: motivoPrioridad
            }).catch((e) => console.error('Error envío correo conflicto:', e));
          }
        }

        canceladas = solicitudesEnConflicto.length;
      }
    }

    // ENVÍO DE CORREO: Pasamos explícitamente el motivo_cancelacion a la reserva gestionada manualmente
    if (reserva.Usuario?.correo) {
      enviarCorreoReserva({
        to:     reserva.Usuario.correo,
        nombre: reserva.Usuario.nombre_completo,
        estado: nuevoEstado,
        reserva: reserva,
        motivo: motivo_cancelacion 
      }).catch((err) => console.error('enviarCorreoReserva (async):', err));
    }

    res.json({
      mensaje: `Reserva ${nuevoEstado} exitosamente.${
        canceladas > 0 ? ` Se cancelaron automáticamente ${canceladas} solicitud(es) en conflicto.` : ''
      }`,
      canceladas,
    });
  } catch (error) {
    console.error('gestionarReserva:', error);
    res.status(500).json({ mensaje: 'Error al procesar la solicitud.' });
  }
};

const cancelarPorMantenimiento = async (req, res) => {
  try {
    const { id_recurso } = req.params;

    const reservasActivas = await Reserva.findAll({
      where: {
        id_recurso,
        estado: { [Op.in]: ['pendiente', 'confirmada'] }
      },
      include: [
        { model: Usuario, attributes: ['nombre_completo', 'correo'] },
        { model: Recurso, attributes: ['nombre'] }
      ]
    });

    if (reservasActivas.length === 0) {
      return res.json({ mensaje: 'No hay reservas activas para este recurso.', canceladas: 0 });
    }

    const motivoMantenimiento = 'El recurso ha sido bloqueado por mantenimiento.';
    const [filas] = await Reserva.update(
      { 
        estado: 'cancelada',
        motivo_cancelacion: motivoMantenimiento 
      },
      {
        where: {
          id_recurso,
          estado: { [Op.in]: ['pendiente', 'confirmada'] }
        }
      }
    );

    for (const reserva of reservasActivas) {
      if (reserva.Usuario?.correo) {
        enviarCorreoReserva({
          to:     reserva.Usuario.correo,
          nombre: reserva.Usuario.nombre_completo,
          estado: 'cancelada',
          reserva: reserva,
          motivo: motivoMantenimiento,
        }).catch((err) => console.error('Email mantenimiento:', err));
      }
    }

    res.json({
      mensaje: `Se cancelaron ${filas} reserva(s) por mantenimiento del recurso.`,
      canceladas: filas
    });
  } catch (error) {
    console.error('cancelarPorMantenimiento:', error);
    res.status(500).json({ mensaje: 'Error al cancelar reservas.' });
  }
};

module.exports = {
  crearReserva,
  obtenerEventosCalendario,
  obtenerReservasPorUsuario,
  obtenerReservasPendientes,
  gestionarReserva,
  cancelarPorMantenimiento,
};