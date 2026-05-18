const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Persona = sequelize.define('Persona', {
  id_persona: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre_completo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  curp: {
    type: DataTypes.STRING(18),
    allowNull: false,
    unique: true,
  }
}, {
  tableName: 'personas',
  timestamps: true,
});

module.exports = Persona;