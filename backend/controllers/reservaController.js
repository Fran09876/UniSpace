// controllers/reservaController.js
const { Op } = require('sequelize');
const Reserva = require('../models/Reserva');
const Recurso = require('../models/Recurso');
const Usuario = require('../models/Usuario');

const STATUS_COLORS = {
  confirmada: '#16a34a',
  pendiente:  '#d97706',
};

const NIVEL_PRIORIDAD = { admin: 3, docente: 2, estudiante: 1 };

// Formatea fecha DATEONLY (string "YYYY-MM-DD") → "YYYY-MM-DD"
const formatFecha = (fecha) => {
  if (!fecha) return '';
  return String(fecha).substring(0, 10);
};

// Formatea TIME de Postgres ("HH:MM:SS" o "HH:MM") → "HH:MM"
const formatHora = (hora) => {
  if (!hora) return '00:00';
  return String(hora).substring(0, 5);
};

// POST /api/reservas/crear
const crearReserva = async (req, res) => {
  try {
    const { id_usuario, id_recurso, fecha, hora_inicio, hora_fin, proposito } = req.body;

    if (!id_usuario || !id_recurso || !fecha || !hora_inicio || !hora_fin || !proposito) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    }
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({ mensaje: 'La hora de inicio debe ser anterior a la hora de fin.' });
    }

    // Bloquear solo si hay reserva CONFIRMADA que se solape
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

// GET /api/reservas/calendario
const obtenerEventosCalendario = async (req, res) => {
  try {
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

// GET /api/reservas/usuario/:id_usuario
const obtenerReservasPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
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

// GET /api/reservas/pendientes
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

// POST /api/reservas/gestionar/:id_reserva
const gestionarReserva = async (req, res) => {
  try {
    const { id_reserva } = req.params;   // UUID string — funciona directo con Sequelize
    const { nuevoEstado } = req.body;

    if (!['confirmada', 'cancelada'].includes(nuevoEstado)) {
      return res.status(400).json({ mensaje: 'Estado no válido.' });
    }

    const reserva = await Reserva.findByPk(id_reserva);
    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada.' });
    }
    if (reserva.estado !== 'pendiente') {
      return res.status(400).json({ mensaje: 'Solo se pueden gestionar reservas en estado "pendiente".' });
    }

    reserva.estado = nuevoEstado;
    await reserva.save();

    let canceladas = 0;

    if (nuevoEstado === 'confirmada') {
      const [filas] = await Reserva.update(
        { estado: 'cancelada' },
        {
          where: {
            id_reserva:  { [Op.ne]: id_reserva },
            id_recurso:  reserva.id_recurso,
            fecha:       reserva.fecha,
            estado:      'pendiente',
            hora_inicio: { [Op.lt]: reserva.hora_fin },
            hora_fin:    { [Op.gt]: reserva.hora_inicio },
          },
        }
      );
      canceladas = filas;
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

module.exports = {
  crearReserva,
  obtenerEventosCalendario,
  obtenerReservasPorUsuario,
  obtenerReservasPendientes,
  gestionarReserva,
};