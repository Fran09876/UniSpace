const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Usuario = require('./Usuario');
const Recurso = require('./Recurso');

const Reserva = sequelize.define('Reserva', {
  id_reserva: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada'),
    defaultValue: 'pendiente',
  }
}, {
  tableName: 'reservas',
  timestamps: true,
});

// Establecer las relaciones (Llaves Foráneas)
Reserva.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Reserva.belongsTo(Recurso, { foreignKey: 'id_recurso' });

module.exports = Reserva;