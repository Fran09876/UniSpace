// models/Recurso.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Recurso = sequelize.define('Recurso', {
  id_recurso: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  capacidad: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('disponible', 'mantenimiento'),
    defaultValue: 'disponible',
  },
}, {
  tableName: 'recursos',
  timestamps: true,
  underscored: false,
});

module.exports = Recurso;