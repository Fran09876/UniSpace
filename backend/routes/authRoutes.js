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
  completarPerfilGoogle,
  solicitarRecuperacion,
  restablecerPassword
} = require('../controllers/authController');

// ===============================
// AUTENTICACIÓN
// ===============================
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/google', googleLogin);

// ===============================
// COMPLETAR DATOS GOOGLE
// ===============================
router.put(
  '/completar-google/:id',
  verifyToken,
  completarPerfilGoogle
);

// ===============================
// RECUPERACIÓN DE CONTRASEÑA
// ===============================
router.post('/forgot-password', solicitarRecuperacion);
router.post('/reset-password', restablecerPassword);

// ===============================
// GESTIÓN DE USUARIOS
// ===============================
router.get('/usuarios', verifyToken, obtenerUsuarios);

router.put(
  '/usuarios/:id',
  verifyToken,
  actualizarUsuario
);

router.put(
  '/usuarios/:id/rol',
  verifyToken,
  cambiarRol
);

module.exports = router;