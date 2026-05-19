const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sequelize = require('../database');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const { OAuth2Client } = require('google-auth-library');
const emailService = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// =========================================
// HELPER: AUTO-SANACIÓN DE PERFIL
// =========================================
// Verifica dinámicamente si el usuario ya tiene todos sus datos reales
const esPerfilRealmenteCompleto = (usuario) => {
  if (usuario.rol === 'admin') return true; // El admin nunca necesita completar perfil
  
  const curpValida = usuario.Persona?.curp && !usuario.Persona.curp.startsWith('TEMP');
  
  if (usuario.rol === 'estudiante') {
    return Boolean(curpValida && usuario.carrera);
  }
  
  if (usuario.rol === 'docente') {
    return Boolean(curpValida && usuario.especialidad && usuario.grado_academico);
  }
  
  return false;
};

// =========================================
// REGISTRO NORMAL
// =========================================
const registrarUsuario = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nombre_completo, correo, password, rol, curp, carrera, especialidad, grado_academico } = req.body;
    const rolFinal = rol || 'estudiante';
    const correoLimpio = correo.trim().toLowerCase();

    if (!curp || !curp.trim()) return res.status(400).json({ mensaje: 'CURP es obligatorio.' });
    if (!/^(C?\d{8})@itoaxaca\.edu\.mx$/.test(correoLimpio)) return res.status(400).json({ mensaje: 'Correo inválido' });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) return res.status(400).json({ mensaje: 'Contraseña débil' });
    if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/.test(curp)) return res.status(400).json({ mensaje: 'CURP inválida' });

    const existeCorreo = await Usuario.findOne({ where: { correo: correoLimpio } });
    if (existeCorreo) return res.status(400).json({ mensaje: 'Correo ya registrado.' });

    const existeCurp = await Persona.findOne({ where: { curp: curp.toUpperCase() } });
    if (existeCurp) return res.status(400).json({ mensaje: 'CURP ya registrada.' });

    const nuevaPersona = await Persona.create({
      nombre_completo,
      curp: curp.toUpperCase()
    }, { transaction: t });

    const nuevoUsuario = await Usuario.create({
      id_persona: nuevaPersona.id_persona,
      correo: correoLimpio,
      password_hash: await bcrypt.hash(password, 10),
      rol: rolFinal,
      numero_control: rolFinal === 'estudiante' ? correoLimpio.split('@')[0] : null,
      carrera: rolFinal === 'estudiante' ? carrera : null,
      especialidad: rolFinal === 'docente' ? especialidad : null,
      grado_academico: rolFinal === 'docente' ? grado_academico : null,
      permisos: rolFinal === 'admin' ? 'ALL' : null,
      perfil_completo: true // Si se registra normal, asumimos que viene completo
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', id: nuevoUsuario.id_usuario });
  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).json({ mensaje: 'Error al registrar usuario.' });
  }
};

// =========================================
// LOGIN NORMAL
// =========================================
const loginUsuario = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) return res.status(400).json({ mensaje: 'Faltan credenciales.' });

    const correoLimpio = correo.trim().toLowerCase();

    const usuario = await Usuario.findOne({
      where: { correo: correoLimpio },
      include: [{ model: Persona }]
    });

    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    if (!usuario.password_hash) return res.status(400).json({ mensaje: 'Inicia sesión con Google.' });

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });

    // AUTO-SANACIÓN: Si la BD dice que está incompleto, pero ya tiene sus datos, lo arreglamos.
    const realmenteCompleto = esPerfilRealmenteCompleto(usuario);
    if (realmenteCompleto && !usuario.perfil_completo) {
      usuario.perfil_completo = true;
      await usuario.save(); // Guarda la corrección en silencio
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
        nombre: usuario.Persona?.nombre_completo,
        rol: usuario.rol,
        perfil_completo: realmenteCompleto
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error en login.' });
  }
};

// =========================================
// LOGIN GOOGLE
// =========================================
const googleLogin = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email, name } = ticket.getPayload();
    const correoLimpio = email.trim().toLowerCase();

    if (!/^(C?\d{8})@itoaxaca\.edu\.mx$/.test(correoLimpio)) {
      return res.status(400).json({ mensaje: 'Solo correos institucionales.' });
    }

    let usuario = await Usuario.findOne({
      where: { correo: correoLimpio },
      include: [{ model: Persona }]
    });

    let esNuevo = false;

    if (!usuario) {
      esNuevo = true;
      const nuevaPersona = await Persona.create({
        nombre_completo: name,
        curp: `TEMP${Date.now()}`
      }, { transaction: t });

      usuario = await Usuario.create({
        id_persona: nuevaPersona.id_persona,
        correo: correoLimpio,
        password_hash: null,
        rol: 'estudiante',
        numero_control: correoLimpio.split('@')[0],
        perfil_completo: false
      }, { transaction: t });
    }

    // AUTO-SANACIÓN igual que en el login normal
    const realmenteCompleto = esPerfilRealmenteCompleto(usuario);
    if (realmenteCompleto && !usuario.perfil_completo && !esNuevo) {
      usuario.perfil_completo = true;
      await usuario.save({ transaction: t });
    }

    await t.commit();

    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Google Login exitoso',
      token,
      requiereCompletarPerfil: !realmenteCompleto, // Solo lo pide si de verdad faltan datos
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.Persona?.nombre_completo || name,
        rol: usuario.rol,
        correo: usuario.correo,
        perfil_completo: realmenteCompleto
      }
    });
  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(400).json({ mensaje: 'Autenticación fallida.' });
  }
};

// =========================================
// COMPLETAR PERFIL GOOGLE
// =========================================
const completarPerfilGoogle = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id_usuario, curp, carrera, especialidad, grado_academico, rol, password } = req.body;

    const usuario = await Usuario.findByPk(id_usuario, { include: [{ model: Persona }] });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/.test(curp.toUpperCase())) {
      return res.status(400).json({ mensaje: 'CURP inválida' });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula y número' });
    }

    const existeCurp = await Persona.findOne({ where: { curp: curp.toUpperCase() } });
    if (existeCurp && existeCurp.id_persona !== usuario.id_persona) {
      return res.status(400).json({ mensaje: 'La CURP ya está registrada' });
    }

    usuario.Persona.curp = curp.toUpperCase();
    await usuario.Persona.save({ transaction: t });

    usuario.rol = rol;
    usuario.password_hash = await bcrypt.hash(password, 10);
    usuario.numero_control = rol === 'estudiante' ? usuario.correo.split('@')[0] : null;
    usuario.carrera = rol === 'estudiante' ? carrera : null;
    usuario.especialidad = rol === 'docente' ? especialidad : null;
    usuario.grado_academico = rol === 'docente' ? grado_academico : null;
    usuario.permisos = rol === 'admin' ? 'ALL' : null;
    usuario.perfil_completo = true;

    await usuario.save({ transaction: t });
    await t.commit();

    res.json({ mensaje: 'Perfil completado correctamente' });
  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).json({ mensaje: 'Error al completar perfil' });
  }
};

// =========================================
// OBTENER USUARIOS
// =========================================
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [{ model: Persona, attributes: ['nombre_completo', 'curp'] }],
      order: [[Persona, 'nombre_completo', 'ASC']]
    });

    const listaUsuarios = usuarios.map(u => ({
      id_usuario: u.id_usuario,
      nombre_completo: u.Persona?.nombre_completo || '',
      correo: u.correo,
      rol: u.rol,
      curp: u.Persona?.curp || '',
      numero_control: u.numero_control,
      carrera: u.carrera,
      especialidad: u.especialidad,
      grado_academico: u.grado_academico,
      permisos: u.permisos,
      perfil_completo: u.perfil_completo
    }));

    res.json(listaUsuarios);
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

// =========================================
// ACTUALIZAR USUARIO
// =========================================
const actualizarUsuario = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { nombre_completo, rol, curp, carrera, especialidad, grado_academico } = req.body;

    const usuario = await Usuario.findByPk(id, { include: [{ model: Persona }] });
    if (!usuario) return res.status(404).json({ mensaje: 'No encontrado' });

    if (usuario.Persona) {
      usuario.Persona.nombre_completo = nombre_completo ?? usuario.Persona.nombre_completo;
      usuario.Persona.curp = curp ? curp.toUpperCase() : usuario.Persona.curp;
      await usuario.Persona.save({ transaction: t });
    }

    const nuevoRol = rol ?? usuario.rol;
    usuario.rol = nuevoRol;
    usuario.numero_control = nuevoRol === 'estudiante' ? (usuario.numero_control || usuario.correo.split('@')[0]) : null;
    usuario.carrera = nuevoRol === 'estudiante' ? (carrera || usuario.carrera) : null;
    usuario.especialidad = nuevoRol === 'docente' ? (especialidad || usuario.especialidad) : null;
    usuario.grado_academico = nuevoRol === 'docente' ? (grado_academico || usuario.grado_academico) : null;
    usuario.permisos = nuevoRol === 'admin' ? 'ALL' : null;

    // Evaluamos si con esta actualización el admin ya le completó los datos faltantes
    usuario.perfil_completo = esPerfilRealmenteCompleto(usuario);

    await usuario.save({ transaction: t });
    await t.commit();

    res.json({ mensaje: 'Actualizado exitosamente' });
  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).json({ mensaje: 'Error al actualizar' });
  }
};

// =========================================
// RECUPERAR CONTRASEÑA
// =========================================
const solicitarRecuperacion = async (req, res) => {
  try {
    const { correo } = req.body;
    const correoLimpio = correo.trim().toLowerCase();

    const usuario = await Usuario.findOne({ where: { correo: correoLimpio } });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const codigo = crypto.randomInt(100000, 999999).toString();

    usuario.reset_token = codigo;
    usuario.reset_token_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await usuario.save();

    await emailService.enviarCorreoRecuperacion(correoLimpio, codigo);

    res.json({ mensaje: 'Código enviado al correo' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al enviar código' });
  }
};

// =========================================
// RESTABLECER PASSWORD
// =========================================
const restablecerPassword = async (req, res) => {
  try {
    const { correo, codigo, nuevoPassword } = req.body;
    const correoLimpio = correo.trim().toLowerCase();

    const usuario = await Usuario.findOne({ where: { correo: correoLimpio } });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (usuario.reset_token !== codigo || !usuario.reset_token_expires || usuario.reset_token_expires < new Date()) {
      return res.status(400).json({ mensaje: 'Código inválido o expirado' });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(nuevoPassword)) {
      return res.status(400).json({ mensaje: 'Contraseña débil' });
    }

    usuario.password_hash = await bcrypt.hash(nuevoPassword, 10);
    usuario.reset_token = null;
    usuario.reset_token_expires = null;
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al restablecer contraseña' });
  }
};

// =========================================
// CAMBIAR ROL
// =========================================
const cambiarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    const usuario = await Usuario.findByPk(id, { include: [{ model: Persona }] });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    usuario.rol = rol;
    
    // Al cambiar de rol (ej. estudiante a docente) verificamos si quedó incompleto
    usuario.perfil_completo = esPerfilRealmenteCompleto(usuario);
    
    await usuario.save();

    res.json({ mensaje: 'Rol actualizado correctamente' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: 'Error al cambiar rol' });
  }
};

// =========================================
// EXPORTS
// =========================================
module.exports = {
  registrarUsuario,
  loginUsuario,
  googleLogin,
  completarPerfilGoogle,
  obtenerUsuarios,
  cambiarRol,
  actualizarUsuario,
  solicitarRecuperacion,
  restablecerPassword
};