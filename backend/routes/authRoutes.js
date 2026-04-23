const express = require('express');
const router = express.Router();
const { registrarUsuario, loginUsuario } = require('../controllers/authController');

// Definir los "endpoints"
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);

module.exports = router;