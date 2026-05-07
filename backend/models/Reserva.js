// models/Reserva.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Reserva = sequelize.define('Reserva', {
  id_reserva: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  id_usuario: {
    type: DataTypes.UUID,   // FK → usuarios.id_usuario (UUID)
    allowNull: false,
  },
  id_recurso: {
    type: DataTypes.UUID,   // FK → recursos.id_recurso (UUID)
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  hora_fin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  proposito: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'expirada'),
    defaultValue: 'pendiente',
  },
  // 🔥 Motivo de cancelación (si aplica)
  motivo_cancelacion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'reservas',
  timestamps: true,
  underscored: false,
});

module.exports = Reserva;