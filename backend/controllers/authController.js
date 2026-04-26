// controllers/authController.js
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// POST /api/auth/registro
const registrarUsuario = async (req, res) => {
  try {
    const { nombre_completo, correo, password, rol } = req.body;

    const usuarioExistente = await Usuario.findOne({ where: { correo } });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
    }

    const salt          = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const nuevoUsuario = await Usuario.create({
      nombre_completo,
      correo,
      password_hash,
      rol: rol || 'estudiante',
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      id: nuevoUsuario.id_usuario,   // UUID
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor al registrar usuario.' });
  }
};

// POST /api/auth/login
const loginUsuario = async (req, res) => {
  try {
    const { correo, password } = req.body;
    console.log('👉 Intento de Login. Correo:', correo);

    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
    }

    // IMPORTANTE: el payload incluye id_usuario (UUID) con la clave "id"
    // para que req.user.id esté disponible en los middlewares.
    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id:     usuario.id_usuario,   // UUID — el frontend lo guarda en localStorage
        nombre: usuario.nombre_completo,
        rol:    usuario.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor al iniciar sesión.' });
  }
};

module.exports = { registrarUsuario, loginUsuario };