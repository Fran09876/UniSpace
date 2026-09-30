const { Sequelize } = require('sequelize');
require('dotenv').config();

// Si existe DATABASE_URL usa la cadena; si no, arma la conexión con las variables individuales
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false
      }
    })
  : new Sequelize(
      process.env.DB_NAME || process.env.PGDATABASE,
      process.env.DB_USER || process.env.PGUSER,
      process.env.DB_PASSWORD || process.env.PGPASSWORD,
      {
        host: process.env.DB_HOST || process.env.PGHOST,
        port: process.env.DB_PORT || process.env.PGPORT || 5432,
        dialect: 'postgres',
        logging: false,
      }
    );

module.exports = sequelize;