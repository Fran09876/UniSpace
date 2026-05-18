const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sequelize = require('../database');
const Persona = require('../models/Persona');
const Usuario = require('../models/Usuario');
const { OAuth2Client } = require('google-auth-library');
const emailService = require('../services/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registrarUsuario = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { nombre_completo, correo, password, rol, curp, carrera, especialidad, grado_academico } = req.body;
    const rolFinal = rol || 'estudiante';

    if (!curp || !curp.trim()) return res.status(400).json({ mensaje: 'CURP es obligatorio.' });
    if (!/^(C?\d{8})@itoaxaca\.edu\.mx$/.test(correo)) return res.status(400).json({ mensaje: 'Correo inválido' });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) return res.status(400).json({ mensaje: 'Contraseña débil' });
    if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/.test(curp)) return res.status(400).json({ mensaje: 'CURP inválida' });

    if (await Usuario.findOne({ where: { correo } })) return res.status(400).json({ mensaje: 'Correo ya registrado.' });
    if (await Persona.findOne({ where: { curp: curp.toUpperCase() } })) return res.status(400).json({ mensaje: 'CURP ya registrada.' });

    const nuevaPersona = await Persona.create({ nombre_completo, curp: curp.toUpperCase() }, { transaction: t });

    const nuevoUsuario = await Usuario.create({
      id_persona: nuevaPersona.id_persona,
      correo,
      password_hash: await bcrypt.hash(password, 10),
      rol: rolFinal,
      numero_control: rolFinal === 'estudiante' ? correo.split('@')[0] : null,
      carrera: rolFinal === 'estudiante' ? carrera : null,
      especialidad: rolFinal === 'docente' ? especialidad : null,
      grado_academico: rolFinal === 'docente' ? grado_academico : null,
      permisos: rolFinal === 'admin' ? 'ALL' : null
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', id: nuevoUsuario.id_usuario });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ mensaje: 'Error al registrar usuario.' });
  }
};

const loginUsuario = async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) return res.status(400).json({ mensaje: 'Faltan credenciales.' });

    const usuario = await Usuario.findOne({ where: { correo: correo.trim().toLowerCase() }, include: [{ model: Persona }] });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    if (!usuario.password_hash) return res.status(400).json({ mensaje: 'Inicia sesión con Google.' });
    if (!(await bcrypt.compare(password, usuario.password_hash))) return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });

    const token = jwt.sign({ id: usuario.id_usuario, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ mensaje: 'Login exitoso', token, usuario: { id: usuario.id_usuario, nombre: usuario.Persona?.nombre_completo, rol: usuario.rol } });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en login.' });
  }
};

const googleLogin = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ticket = await client.verifyIdToken({ idToken: req.body.token, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name } = ticket.getPayload();

    if (!/^(C?\d{8})@itoaxaca\.edu\.mx$/.test(email)) return res.status(400).json({ mensaje: 'Solo correos institucionales.' });

    let usuario = await Usuario.findOne({ where: { correo: email }, include: [{ model: Persona }] });

    if (!usuario) {
      const nuevaPersona = await Persona.create({ nombre_completo: name, curp: `PROV${Date.now()}`.substring(0, 18) }, { transaction: t });
      usuario = await Usuario.create({
        id_persona: nuevaPersona.id_persona, correo: email, password_hash: null, rol: 'estudiante', numero_control: email.split('@')[0]
      }, { transaction: t });
    }
    await t.commit();
    const token = jwt.sign({ id: usuario.id_usuario, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ mensaje: 'Google Login exitoso', token, usuario: { id: usuario.id_usuario, nombre: usuario.Persona?.nombre_completo || name, rol: usuario.rol } });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ mensaje: 'Autenticación fallida.' });
  }
};

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
      permisos: u.permisos
    }));
    res.json(listaUsuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

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

    await usuario.save({ transaction: t });
    await t.commit();
    res.json({ mensaje: 'Actualizado exitosamente' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ mensaje: 'Error al actualizar' });
  }
};

const solicitarRecuperacion = async (req, res) => { /* Código idéntico anterior */ };
const restablecerPassword = async (req, res) => { /* Código idéntico anterior */ };
const cambiarRol = async (req, res) => { /* Código idéntico anterior */ };

module.exports = { registrarUsuario, loginUsuario, googleLogin, obtenerUsuarios, cambiarRol, actualizarUsuario, solicitarRecuperacion, restablecerPassword };