const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Estudiante = sequelize.define('Estudiante', {
  id_estudiante: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_usuario: {
    type: DataTypes.UUID,
    unique: true,
  },
  numero_control: {
    type: DataTypes.STRING,
    unique: true,
  },
  carrera: DataTypes.STRING
}, {
  tableName: 'estudiantes',
  timestamps: false
});

module.exports = Estudiante;