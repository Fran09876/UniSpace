const Reserva = require('../models/Reserva');
const Recurso = require('../models/Recurso');
const Usuario = require('../models/Usuario');

// Función para crear una nueva reserva
const crearReserva = async (req, res) => {
  try {
    const { id_usuario, id_recurso, fecha, hora_inicio, hora_fin, proposito } = req.body;

    // Aquí podríamos agregar lógica extra (ej. verificar si el espacio ya está ocupado a esa hora)
    // Por ahora, crearemos la reserva directamente
    const nuevaReserva = await Reserva.create({
      id_usuario,
      id_recurso,
      fecha,
      hora_inicio,
      hora_fin,
      proposito,
      estado: 'confirmada' // Las ponemos confirmadas por defecto para las pruebas
    });

    res.status(201).json({ mensaje: 'Reserva creada con éxito', reserva: nuevaReserva });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la reserva.' });
  }
};

// Función para obtener las reservas de un usuario específico
const obtenerReservasPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    // Buscamos las reservas y traemos también los datos del Recurso reservado (JOIN)
    const reservas = await Reserva.findAll({
      where: { id_usuario },
      include: [
        { model: Recurso, attributes: ['nombre', 'tipo'] }
      ]
    });

    res.json(reservas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener las reservas.' });
  }
};

module.exports = { crearReserva, obtenerReservasPorUsuario };