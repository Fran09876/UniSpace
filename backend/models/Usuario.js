const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },

  password_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  rol: {
    type: DataTypes.ENUM('estudiante', 'docente', 'admin'),
    defaultValue: 'estudiante',
  },

  // --- CAMPOS PARA RECUPERACIÓN DE CONTRASEÑA ---
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  }

}, {
  tableName: 'usuarios',
  freezeTableName: true,
  timestamps: true
});

module.exports = Usuario;