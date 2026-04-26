const express = require('express');
const router  = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  crearReserva,
  obtenerEventosCalendario,
  obtenerReservasPorUsuario,
  obtenerReservasPendientes,
  gestionarReserva,
} = require('../controllers/reservaController');

router.post('/crear',                  verifyToken, crearReserva);
router.get('/calendario',              verifyToken, obtenerEventosCalendario);
router.get('/pendientes',              verifyToken, obtenerReservasPendientes);
router.get('/usuario/:id_usuario',     verifyToken, obtenerReservasPorUsuario);
router.post('/gestionar/:id_reserva',  verifyToken, gestionarReserva);

module.exports = router;