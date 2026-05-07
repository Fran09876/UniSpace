const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

const { 
  registrarUsuario, 
  loginUsuario, 
  googleLogin, 
  obtenerUsuarios, 
  cambiarRol,
  actualizarUsuario,
  solicitarRecuperacion,   // <-- NUEVO
  restablecerPassword      // <-- NUEVO
} = require('../controllers/authController');

// Definir los "endpoints" de autenticación
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/google', googleLogin);

// NUEVO: Endpoints de recuperación de contraseña
router.post('/forgot-password', solicitarRecuperacion);
router.post('/reset-password', restablecerPassword);

// Definir los "endpoints" de gestión de usuarios
router.get('/usuarios', verifyToken, obtenerUsuarios);
router.put('/usuarios/:id', verifyToken, actualizarUsuario);
router.put('/usuarios/:id/rol', verifyToken, cambiarRol);

module.exports = router;