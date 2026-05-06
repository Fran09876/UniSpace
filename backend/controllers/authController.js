const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { OAuth2Client } = require('google-auth-library');
const emailService = require('../services/emailService');

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
    
    // Limpiamos espacios fantasmas
    const correoLimpio = correo.trim();
    
    console.log('\n🔍 --- DETECTIVE MODE: INICIANDO LOGIN ---');
    console.log('1. Correo que React envió:', `"${correoLimpio}"`);

    const usuario = await Usuario.findOne({ where: { correo: correoLimpio } });
    
    if (!usuario) {
      console.log('❌ RESULTADO: Usuario no encontrado en la BD.');
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    if (!usuario.password_hash) {
      return res.status(400).json({ mensaje: 'Este correo está registrado con Google. Inicia sesión con Google.' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      console.log('❌ Contraseña incorrecta.');
      return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log('✅ RESULTADO: ¡Login exitoso!');
    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: usuario.id_usuario, nombre: usuario.nombre_completo, rol: usuario.rol },
    });
  } catch (error) {
    console.error('Error catastrófico en login:', error);
    res.status(500).json({ mensaje: 'Error en el servidor al iniciar sesión.' });
  }
};

// POST /api/auth/google
const googleLogin = async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    const regexCorreo = /^(C?\d{8})@itoaxaca\.edu\.mx$/;
    if (!regexCorreo.test(email)) {
        return res.status(400).json({ mensaje: 'Solo se permiten correos @itoaxaca.edu.mx' });
    }

    let usuario = await Usuario.findOne({ where: { correo: email } });

    if (!usuario) {
      usuario = await Usuario.create({
        nombre_completo: name,
        correo: email,
        password_hash: null, 
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

// --- NUEVAS FUNCIONES DE RECUPERACIÓN (Blindadas contra espacios y fechas nulas) ---

// POST /api/auth/forgot-password
const solicitarRecuperacion = async (req, res) => {
  try {
    const { correo } = req.body;
    const correoLimpio = correo.trim();
    
    const usuario = await Usuario.findOne({ where: { correo: correoLimpio } });
    if (!usuario) return res.status(404).json({ mensaje: 'Correo no registrado' });

    const codigo = Math.floor(100000 + Math.random() * 900000).toString(); 
    
    usuario.reset_token = codigo;
    usuario.reset_token_expires = new Date(Date.now() + 15 * 60 * 1000); 
    await usuario.save();

    console.log(`\n💾 --- CÓDIGO GENERADO ---`);
    console.log(`Se guardó el código "${codigo}" para el correo: ${correoLimpio}`);

    await emailService.enviarCorreoRecuperacion(correoLimpio, codigo);
    res.json({ mensaje: 'Código enviado a tu correo institucional' });
  } catch (error) {
    console.error('Error al solicitar recuperación:', error);
    res.status(500).json({ mensaje: 'Error al enviar el correo' });
  }
};

// POST /api/auth/reset-password
const restablecerPassword = async (req, res) => {
  try {
    const correo = req.body.correo.trim();
    const codigo = req.body.codigo.trim(); 
    const nuevoPassword = req.body.nuevoPassword;

    console.log('\n🕵️‍♂️ --- DETECTIVE MODE: VALIDANDO CÓDIGO ---');
    console.log(`1. React envió -> Correo: "${correo}", Código: "${codigo}"`);

    const usuarioEnBD = await Usuario.findOne({ where: { correo } });

    if (!usuarioEnBD) {
      console.log('❌ 2. El correo no existe en la base de datos.');
      return res.status(400).json({ mensaje: 'Código inválido o expirado' });
    }

    console.log(`2. Datos guardados en la BD para este correo:`);
    console.log(`   - Código en BD: "${usuarioEnBD.reset_token}"`);
    console.log(`   - Expiración en BD: ${usuarioEnBD.reset_token_expires}`);
    console.log(`   - Fecha Actual: ${new Date()}`);

    if (usuarioEnBD.reset_token !== codigo) {
      console.log('❌ 3. Los códigos NO coinciden.');
      return res.status(400).json({ mensaje: 'Código inválido o expirado' });
    }

    if (!usuarioEnBD.reset_token_expires || usuarioEnBD.reset_token_expires < new Date()) {
      console.log('❌ 3. El código ha expirado o la fecha se guardó como nula.');
      return res.status(400).json({ mensaje: 'Código inválido o expirado' });
    }

    console.log('✅ 3. El código es CORRECTO y está VIGENTE.');

    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regexPassword.test(nuevoPassword)) {
      console.log('❌ 4. La nueva contraseña no cumple los requisitos.');
      return res.status(400).json({
        mensaje: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'
      });
    }

    usuarioEnBD.password_hash = await bcrypt.hash(nuevoPassword, 10);
    usuarioEnBD.reset_token = null;
    usuarioEnBD.reset_token_expires = null;
    await usuarioEnBD.save();

    console.log('✅ 4. ¡Contraseña cambiada con éxito!');
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ mensaje: 'Error al actualizar la contraseña' });
  }
};

// --- FUNCIONES DE GESTIÓN DE USUARIOS ---

// GET /api/auth/usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id_usuario', 'nombre_completo', 'correo', 'rol'],
      order: [['nombre_completo', 'ASC']]
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

// PUT /api/auth/usuarios/:id/rol
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

module.exports = { 
  registrarUsuario, 
  loginUsuario, 
  googleLogin, 
  obtenerUsuarios, 
  cambiarRol,
  solicitarRecuperacion,
  restablecerPassword
};