const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// 1. Si existe una cadena de conexión en DATABASE_URL
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} 
// 2. Si Railway pasa las variables individuales (PGHOST, PGUSER, etc.)
else if (process.env.PGHOST || process.env.DB_HOST) {
  sequelize = new Sequelize(
    process.env.PGDATABASE || process.env.DB_NAME,
    process.env.PGUSER || process.env.DB_USER,
    process.env.PGPASSWORD || process.env.DB_PASSWORD,
    {
      host: process.env.PGHOST || process.env.DB_HOST,
      port: process.env.PGPORT || process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }
  );
} 
// 3. Si no detecta nada, lanza un error claro antes de romper Sequelize
else {
  console.error('CRÍTICO: No se encontraron variables de conexión a la base de datos.');
  process.exit(1);
}

module.exports = sequelize;