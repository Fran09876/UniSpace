const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Docente = sequelize.define('Docente', {
  id_docente: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_usuario: {
    type: DataTypes.UUID,
    unique: true,
  },
  especialidad: DataTypes.STRING,
  grado_academico: DataTypes.STRING
}, {
  tableName: 'docentes',
  timestamps: false
});

module.exports = Docente;