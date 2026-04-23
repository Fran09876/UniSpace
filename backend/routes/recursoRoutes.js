const express = require('express');
const router = express.Router();
const { crearRecurso, obtenerRecursos } = require('../controllers/recursoController');

// Rutas
router.post('/', crearRecurso);       // Para crear (POST)
router.get('/', obtenerRecursos);     // Para leer (GET)

module.exports = router;