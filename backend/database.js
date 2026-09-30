const { Sequelize } = require('sequelize');
require('dotenv').config();

// Se toma la URL de Railway o la variable local
const dbUrl = process.env.DATABASE_URL;

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Indispensable para aceptar el certificado SSL de Railway
    }
  }
});

module.exports = sequelize;