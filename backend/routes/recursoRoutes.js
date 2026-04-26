const express = require('express');
const router  = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  obtenerRecursos,
  obtenerRecurso,
  crearRecurso,
  actualizarRecurso,
  eliminarRecurso,
} = require('../controllers/recursoController');

router.get('/',     verifyToken, obtenerRecursos);
router.get('/:id',  verifyToken, obtenerRecurso);
router.post('/',    verifyToken, crearRecurso);
router.put('/:id',  verifyToken, actualizarRecurso);
router.delete('/:id', verifyToken, eliminarRecurso);

module.exports = router;