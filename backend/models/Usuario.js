const { DataTypes } = require('sequelize');
const sequelize = require('../database');
const Persona = require('./Persona');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  id_persona: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Persona,
      key: 'id_persona'
    }
  },

  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },

  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  rol: {
    type: DataTypes.ENUM('estudiante', 'docente', 'admin'),
    defaultValue: 'estudiante',
  },

  numero_control: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true
  },

  carrera: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  especialidad: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  grado_academico: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  permisos: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  reset_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  reset_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },

  perfil_completo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }

}, {
  tableName: 'usuarios',
  timestamps: true,
});

Usuario.belongsTo(Persona, {
  foreignKey: 'id_persona'
});

Persona.hasOne(Usuario, {
  foreignKey: 'id_persona'
});

module.exports = Usuario;