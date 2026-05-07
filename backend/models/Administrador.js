const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Administrador = sequelize.define('Administrador', {
  id_admin: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_usuario: {
    type: DataTypes.UUID,
    unique: true,
  },
  permisos: DataTypes.TEXT
}, {
  tableName: 'administradores',
  timestamps: false
});

module.exports = Administrador;