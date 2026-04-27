const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/registro
const registrarUsuario = async (req, res) => {
  try {
    const { nombre_completo, correo, password, rol } = req.body;

    const regexCorreo = /^(C?\d{8})@itoaxaca\.edu\.mx$/;
    if (!regexCorreo.test(correo)) {
      return res.status(400).json({ mensaje: 'Correo institucional inválido' });
    }

    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regexPassword.test(password)) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'
      });
    }

    const usuarioExistente = await Usuario.findOne({ where: { correo } });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const nuevoUsuario = await Usuario.create({
      nombre_completo,
      correo,
      password_hash,
      rol: rol || 'estudiante',
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      id: nuevoUsuario.id_usuario,
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

    if (!usuario.password_hash) {
      return res.status(400).json({ mensaje: 'Este correo está registrado con Google. Inicia sesión con Google.' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre_completo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error en el servidor al iniciar sesión.' });
  }
};

// NUEVO: POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    // Validar que sea correo institucional si es necesario (opcional para Google)
    const regexCorreo = /^(C?\d{8})@itoaxaca\.edu\.mx$/;
    if (!regexCorreo.test(email)) {
        return res.status(400).json({ mensaje: 'Solo se permiten correos @itoaxaca.edu.mx' });
    }

    let usuario = await Usuario.findOne({ where: { correo: email } });

    if (!usuario) {
      // Registro automático si no existe
      usuario = await Usuario.create({
        nombre_completo: name,
        correo: email,
        password_hash: null, // No hay contraseña para usuarios de Google
        rol: 'estudiante',
      });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Login con Google exitoso',
      token,
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre_completo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error Google Auth:', error);
    res.status(400).json({ mensaje: 'Autenticación de Google fallida.' });
  }
};

// GET /api/usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id_usuario', 'nombre_completo', 'correo', 'rol'], // Excluimos la contraseña
      order: [['nombre_completo', 'ASC']]
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

// PUT /api/usuarios/:id/rol
const cambiarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    usuario.rol = rol;
    await usuario.save();

    res.json({ mensaje: 'Rol actualizado exitosamente', usuario });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el rol' });
  }
};

// Asegúrate de exportar todas las funciones nuevas
module.exports = { 
  registrarUsuario, 
  loginUsuario, 
  googleLogin, 
  obtenerUsuarios, 
  cambiarRol 
};