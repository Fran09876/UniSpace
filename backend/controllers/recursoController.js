// controllers/recursoController.js
const { Op } = require('sequelize');
const Recurso = require('../models/Recurso');
const Reserva = require('../models/Reserva');

// GET /api/recursos
const obtenerRecursos = async (req, res) => {
  try {
    const recursos = await Recurso.findAll({ order: [['nombre', 'ASC']] });
    res.json(recursos);
  } catch (error) {
    console.error('obtenerRecursos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los recursos.' });
  }
};

// GET /api/recursos/:id
const obtenerRecurso = async (req, res) => {
  try {
    const recurso = await Recurso.findByPk(req.params.id);
    if (!recurso) return res.status(404).json({ mensaje: 'Recurso no encontrado.' });
    res.json(recurso);
  } catch (error) {
    console.error('obtenerRecurso:', error);
    res.status(500).json({ mensaje: 'Error al obtener el recurso.' });
  }
};

// POST /api/recursos
const crearRecurso = async (req, res) => {
  try {
    const { nombre, tipo, capacidad, descripcion, estado } = req.body;

    if (!nombre?.trim() || !tipo?.trim()) {
      return res.status(400).json({ mensaje: 'El nombre y el tipo son obligatorios.' });
    }

    const existente = await Recurso.findOne({ where: { nombre: nombre.trim() } });
    if (existente) {
      return res.status(409).json({ mensaje: `Ya existe un recurso llamado "${nombre}".` });
    }

    const nuevo = await Recurso.create({
      nombre:      nombre.trim(),
      tipo:        tipo.trim(),
      capacidad:   Number(capacidad) || 0,
      descripcion: descripcion?.trim() || null,
      estado:      estado || 'disponible',
    });

    res.status(201).json({ mensaje: 'Recurso creado exitosamente.', recurso: nuevo });
  } catch (error) {
    console.error('crearRecurso:', error);
    res.status(500).json({ mensaje: 'Error al crear el recurso.' });
  }
};

// PUT /api/recursos/:id
const actualizarRecurso = async (req, res) => {
  try {
    const recurso = await Recurso.findByPk(req.params.id);
    if (!recurso) return res.status(404).json({ mensaje: 'Recurso no encontrado.' });

    const { nombre, tipo, capacidad, descripcion, estado } = req.body;

    if (nombre && nombre.trim() !== recurso.nombre) {
      const dup = await Recurso.findOne({ where: { nombre: nombre.trim() } });
      if (dup) {
        return res.status(409).json({ mensaje: `Ya existe otro recurso llamado "${nombre}".` });
      }
    }

    await recurso.update({
      nombre:      nombre?.trim()      ?? recurso.nombre,
      tipo:        tipo?.trim()        ?? recurso.tipo,
      capacidad:   capacidad != null   ? Number(capacidad) : recurso.capacidad,
      descripcion: descripcion != null ? descripcion.trim() || null : recurso.descripcion,
      estado:      estado              ?? recurso.estado,
    });

    res.json({ mensaje: 'Recurso actualizado.', recurso });
  } catch (error) {
    console.error('actualizarRecurso:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el recurso.' });
  }
};

// DELETE /api/recursos/:id
// Protegido: no permite eliminar si hay reservas activas
const eliminarRecurso = async (req, res) => {
  try {
    const recurso = await Recurso.findByPk(req.params.id);
    if (!recurso) return res.status(404).json({ mensaje: 'Recurso no encontrado.' });

    const activas = await Reserva.count({
      where: {
        id_recurso: req.params.id,   // UUID string — Sequelize lo pasa directo
        estado: { [Op.in]: ['pendiente', 'confirmada'] },
      },
    });

    if (activas > 0) {
      return res.status(400).json({
        mensaje: `No se puede eliminar: tiene ${activas} reserva(s) activa(s). Cancélalas primero.`,
      });
    }

    await recurso.destroy();
    res.json({ mensaje: 'Recurso eliminado exitosamente.' });
  } catch (error) {
    console.error('eliminarRecurso:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el recurso.' });
  }
};

module.exports = {
  obtenerRecursos,
  obtenerRecurso,
  crearRecurso,
  actualizarRecurso,
  eliminarRecurso,
};