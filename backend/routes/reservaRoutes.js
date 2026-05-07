const express = require('express');
const router  = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  crearReserva,
  obtenerEventosCalendario,
  obtenerReservasPorUsuario,
  obtenerReservasPendientes,
  gestionarReserva,
  cancelarPorMantenimiento,
} = require('../controllers/reservaController');

router.post('/crear',                         verifyToken, crearReserva);
router.get('/calendario',                     verifyToken, obtenerEventosCalendario);
router.get('/pendientes',                     verifyToken, obtenerReservasPendientes);
router.get('/usuario/:id_usuario',            verifyToken, obtenerReservasPorUsuario);
router.post('/gestionar/:id_reserva',         verifyToken, gestionarReserva);
router.post('/cancelar-mantenimiento/:id_recurso', verifyToken, cancelarPorMantenimiento);

module.exports = router;