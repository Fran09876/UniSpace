const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Controlador para registrar un nuevo usuario
const registrarUsuario = async (req, res) => {
  try {
    const { nombre_completo, correo, password, rol } = req.body;

    // Verificar si el correo ya existe
    const usuarioExistente = await Usuario.findOne({ where: { correo } });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
    }

    // Encriptar la contraseña (hashing)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Guardar el usuario en PostgreSQL
    const nuevoUsuario = await Usuario.create({
      nombre_completo,
      correo,
      password_hash,
      rol: rol || 'estudiante'
    });

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', id: nuevoUsuario.id_usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor al registrar usuario.' });
  }
};

// Controlador para el Login
const loginUsuario = async (req, res) => {
  try {
    const { correo, password } = req.body;
    console.log("👉 Intento de Login recibido. Correo:", correo, " | Pass:", password);
    // Buscar al usuario
    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    // Comparar contraseñas
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
    }

    // Generar el Token JWT
    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // El token expira en 8 horas
    );

    // Devolvemos el token que Sabas guardará en el localStorage
    // Devolvemos el token que Sabas guardará en el localStorage
    res.json({ 
      mensaje: 'Login exitoso', 
      token, 
      usuario: { 
        id: usuario.id_usuario,
        nombre: usuario.nombre_completo, 
        rol: usuario.rol 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor al iniciar sesión.' });
  }
};

module.exports = { registrarUsuario, loginUsuario };