// models/Usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre_completo: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  correo: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('estudiante', 'docente', 'admin'),
    defaultValue: 'estudiante',
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
  underscored: false,
});

module.exports = Usuario;