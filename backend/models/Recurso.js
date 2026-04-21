const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Recurso = sequelize.define('Recurso', {
  id_recurso: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.STRING, // Ej: Laboratorio, Aula, Auditorio
    allowNull: false,
  },
  capacidad: {
    type: DataTypes.INTEGER,
  },
  estado: {
    type: DataTypes.ENUM('disponible', 'mantenimiento', 'ocupado'),
    defaultValue: 'disponible',
  }
}, {
  tableName: 'recursos',
  timestamps: true,
});

module.exports = Recurso;