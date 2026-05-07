const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Docente = require('../models/Docente');
const Estudiante = require('../models/Estudiante');
const Administrador = require('../models/Administrador');

const { OAuth2Client } = require('google-auth-library');
const emailService = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registrarUsuario = async (req, res) => {
  try {
    const { 
      nombre_completo, 
      correo, 
      password, 
      rol, 
      curp,
      carrera,
      especialidad,
      grado_academico
    } = req.body;

    // 🔥 VALIDACIÓN: CURP es obligatorio
    if (!curp || !curp.trim()) {
      return res.status(400).json({ mensaje: 'CURP es obligatorio.' });
    }

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

    const regexCURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/;
    if (!regexCURP.test(curp)) {
      return res.status(400).json({ mensaje: 'CURP inválida. Formato: XXXX000000HXXXXXX' });
    }

    const usuarioExistente = await Usuario.findOne({ where: { correo } });
    if (usuarioExistente) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
    }

    // 🔥 Verificar si la CURP ya existe
    const curpExistente = await Usuario.findOne({ where: { curp: curp.toUpperCase() } });
    if (curpExistente) {
      return res.status(400).json({ mensaje: 'Esta CURP ya está registrada en el sistema.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre_completo,
      correo,
      password_hash,
      rol: rol || 'estudiante',
      curp: curp.toUpperCase()
    });

    // 🔥 ESTUDIANTE
    if (nuevoUsuario.rol === 'estudiante') {
      await Estudiante.create({
        id_usuario: nuevoUsuario.id_usuario,
        numero_control: correo.split('@')[0],
        carrera: carrera || null
      });
    }

    // 🔥 DOCENTE
    if (nuevoUsuario.rol === 'docente') {
      await Docente.create({
        id_usuario: nuevoUsuario.id_usuario,
        especialidad: especialidad || null,
        grado_academico: grado_academico || null
      });
    }

    // 🔥 ADMIN
    if (nuevoUsuario.rol === 'admin') {
      await Administrador.create({
        id_usuario: nuevoUsuario.id_usuario,
        permisos: 'ALL'
      });
    }

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
    let { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios.' });
    }

    const correoLimpio = correo.trim().toLowerCase();

    console.log('\n🔍 --- DETECTIVE MODE: INICIANDO LOGIN ---');
    console.log('1. Correo que React envió:', `"${correoLimpio}"`);

    const usuario = await Usuario.findOne({
      where: {
        correo: correoLimpio
      }
    });

    if (!usuario) {
      console.log('❌ RESULTADO: Usuario no encontrado en la BD.');
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    console.log('2. Usuario encontrado:', usuario.correo);

    if (!usuario.password_hash) {
      return res.status(400).json({
        mensaje: 'Este correo está registrado con Google. Inicia sesión con Google.'
      });
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
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre_completo,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('❌ ERROR DETALLADO EN LOGIN:', error);
    res.status(500).json({
      mensaje: 'Error en el servidor al iniciar sesión.',
      detalle: error.message
    });
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
    const { email, name } = payload;

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

      // 🔥 crear perfil estudiante automáticamente
      await Estudiante.create({
        id_usuario: usuario.id_usuario,
        numero_control: email.split('@')[0]
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

// --- RECUPERACIÓN ---

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

    await emailService.enviarCorreoRecuperacion(correoLimpio, codigo);
    res.json({ mensaje: 'Código enviado a tu correo institucional' });
  } catch (error) {
    console.error('Error al solicitar recuperación:', error);
    res.status(500).json({ mensaje: 'Error al enviar el correo' });
  }
};

const restablecerPassword = async (req, res) => {
  try {
    const correo = req.body.correo.trim();
    const codigo = req.body.codigo.trim(); 
    const nuevoPassword = req.body.nuevoPassword;

    const usuarioEnBD = await Usuario.findOne({ where: { correo } });

    if (!usuarioEnBD) {
      return res.status(400).json({ mensaje: 'Código inválido o expirado' });
    }

    if (usuarioEnBD.reset_token !== codigo) {
      return res.status(400).json({ mensaje: 'Código inválido o expirado' });
    }

    if (!usuarioEnBD.reset_token_expires || usuarioEnBD.reset_token_expires < new Date()) {
      return res.status(400).json({ mensaje: 'Código inválido o expirado' });
    }

    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regexPassword.test(nuevoPassword)) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número'
      });
    }

    usuarioEnBD.password_hash = await bcrypt.hash(nuevoPassword, 10);
    usuarioEnBD.reset_token = null;
    usuarioEnBD.reset_token_expires = null;
    await usuarioEnBD.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ mensaje: 'Error al actualizar la contraseña' });
  }
};

// --- GESTIÓN ---

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
    res.status(500).json({ mensaje: 'Error al actualizar el rol' });
  }
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id_usuario', 'nombre_completo', 'correo', 'rol', 'curp'],
      include: [
        { model: Estudiante, attributes: ['carrera'], required: false },
        { model: Docente, attributes: ['especialidad', 'grado_academico'], required: false },
        { model: Administrador, attributes: ['permisos'], required: false }
      ],
      order: [['nombre_completo', 'ASC']]
    });

    const listaUsuarios = usuarios.map((usuario) => ({
      id_usuario: usuario.id_usuario,
      nombre_completo: usuario.nombre_completo,
      correo: usuario.correo,
      rol: usuario.rol,
      curp: usuario.curp,
      carrera: usuario.Estudiante?.carrera || null,
      especialidad: usuario.Docente?.especialidad || null,
      grado_academico: usuario.Docente?.grado_academico || null,
      permisos: usuario.Administrador?.permisos || null
    }));

    res.json(listaUsuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre_completo,
      rol,
      curp,
      carrera,
      especialidad,
      grado_academico
    } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // 🔥 VALIDACIÓN: Si se intenta actualizar CURP, debe ser válido y obligatorio si es nuevo
    if (curp) {
      const regexCURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/;
      if (!regexCURP.test(curp)) {
        return res.status(400).json({ mensaje: 'CURP inválida. Formato: XXXX000000HXXXXXX' });
      }

      // Verificar que no exista otra CURP igual
      if (curp.toUpperCase() !== usuario.curp) {
        const curpExistente = await Usuario.findOne({ 
          where: { 
            curp: curp.toUpperCase(),
            id_usuario: { [require('sequelize').Op.ne]: id }
          } 
        });
        if (curpExistente) {
          return res.status(400).json({ mensaje: 'Esta CURP ya está registrada en el sistema.' });
        }
      }
    }

    const rolesValidos = ['estudiante', 'docente', 'admin'];
    if (rol && !rolesValidos.includes(rol)) {
      return res.status(400).json({ mensaje: 'Rol inválido' });
    }

    usuario.nombre_completo = nombre_completo ?? usuario.nombre_completo;
    usuario.rol = rol ?? usuario.rol;
    if (curp) {
      usuario.curp = curp.toUpperCase();
    }
    await usuario.save();

    if (usuario.rol === 'estudiante') {
      await Docente.destroy({ where: { id_usuario: id } });
      await Administrador.destroy({ where: { id_usuario: id } });

      const estudiante = await Estudiante.findOne({ where: { id_usuario: id } });
      if (estudiante) {
        await estudiante.update({ carrera: carrera || estudiante.carrera || null });
      } else {
        await Estudiante.create({
          id_usuario: id,
          numero_control: usuario.correo.split('@')[0],
          carrera: carrera || null
        });
      }
    }

    if (usuario.rol === 'docente') {
      await Estudiante.destroy({ where: { id_usuario: id } });
      await Administrador.destroy({ where: { id_usuario: id } });

      const docente = await Docente.findOne({ where: { id_usuario: id } });
      if (docente) {
        await docente.update({
          especialidad: especialidad || docente.especialidad || null,
          grado_academico: grado_academico || docente.grado_academico || null
        });
      } else {
        await Docente.create({
          id_usuario: id,
          especialidad: especialidad || null,
          grado_academico: grado_academico || null
        });
      }
    }

    if (usuario.rol === 'admin') {
      await Estudiante.destroy({ where: { id_usuario: id } });
      await Docente.destroy({ where: { id_usuario: id } });

      const admin = await Administrador.findOne({ where: { id_usuario: id } });
      if (admin) {
        await admin.update({ permisos: 'ALL' });
      } else {
        await Administrador.create({
          id_usuario: id,
          permisos: 'ALL'
        });
      }
    }

    const usuarioActualizado = await Usuario.findByPk(id, {
      attributes: ['id_usuario', 'nombre_completo', 'correo', 'rol', 'curp'],
      include: [
        { model: Estudiante, attributes: ['carrera'], required: false },
        { model: Docente, attributes: ['especialidad', 'grado_academico'], required: false },
        { model: Administrador, attributes: ['permisos'], required: false }
      ]
    });

    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario: {
        id_usuario: usuarioActualizado.id_usuario,
        nombre_completo: usuarioActualizado.nombre_completo,
        correo: usuarioActualizado.correo,
        rol: usuarioActualizado.rol,
        curp: usuarioActualizado.curp,
        carrera: usuarioActualizado.Estudiante?.carrera || null,
        especialidad: usuarioActualizado.Docente?.especialidad || null,
        grado_academico: usuarioActualizado.Docente?.grado_academico || null,
        permisos: usuarioActualizado.Administrador?.permisos || null
      }
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
  }
};

module.exports = { 
  registrarUsuario, 
  loginUsuario, 
  googleLogin, 
  obtenerUsuarios, 
  cambiarRol,
  actualizarUsuario,
  solicitarRecuperacion,
  restablecerPassword
};