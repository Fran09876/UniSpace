const express = require('express');
const router = express.Router();
const { crearReserva, obtenerReservasPorUsuario } = require('../controllers/reservaController');

// Rutas
router.post('/', crearReserva);                   // Para hacer la reserva
router.get('/usuario/:id_usuario', obtenerReservasPorUsuario); // Para ver las reservas de un usuario

module.exports = router;