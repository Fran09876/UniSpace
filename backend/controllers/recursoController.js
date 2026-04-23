const Recurso = require('../models/Recurso');

// Función para registrar un nuevo espacio (Aula, Laboratorio, etc.)
const crearRecurso = async (req, res) => {
  try {
    const { nombre, tipo, capacidad, estado } = req.body;

    const nuevoRecurso = await Recurso.create({
      nombre,
      tipo,
      capacidad,
      estado: estado || 'disponible'
    });

    res.status(201).json({ mensaje: 'Recurso creado exitosamente', recurso: nuevoRecurso });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear el recurso.' });
  }
};

// Función para obtener la lista de todos los espacios (Para el calendario de Sabas)
const obtenerRecursos = async (req, res) => {
  try {
    const recursos = await Recurso.findAll();
    res.json(recursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los recursos.' });
  }
};

module.exports = { crearRecurso, obtenerRecursos };