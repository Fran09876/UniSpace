const express = require('express');
const router = express.Router();

// Importamos TODAS las funciones que destructuramos del controlador
const { 
  registrarUsuario, 
  loginUsuario, 
  googleLogin, 
  obtenerUsuarios, 
  cambiarRol 
} = require('../controllers/authController');

// Definir los "endpoints" de autenticación
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/google', googleLogin);

// Definir los "endpoints" de gestión de usuarios
router.get('/usuarios', obtenerUsuarios);
router.put('/usuarios/:id/rol', cambiarRol);

module.exports = router;