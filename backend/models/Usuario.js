const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.UUID, // Usamos UUID (letras y números) en lugar de un ID 1, 2, 3 por seguridad
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre_completo: {
    type: DataTypes.STRING,
    allowNull: false, // No permitimos que esté vacío
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // No puede haber dos cuentas con el mismo correo institucional
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('estudiante', 'docente', 'admin'),
    defaultValue: 'estudiante',
  }
}, {
  tableName: 'usuarios', // Nombre de la tabla en Postgres
  timestamps: true, // Agrega automáticamente las columnas 'createdAt' y 'updatedAt'
});

module.exports = Usuario;