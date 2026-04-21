const express = require('express');
const cors = require('cors');
const sequelize = require('./database');
const Usuario = require('./models/Usuario');
const Recurso = require('./models/Recurso');
const Reserva = require('./models/Reserva');

const app = express();
app.use(cors());
app.use(express.json());

// Esta ruta hará que el navegador muestre un mensaje en lugar de un error
app.get('/', (req, res) => {
  res.json({ mensaje: "API de UniSpace en línea y sincronizada." });
});

const iniciarServidor = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida.');
    
    // Sincroniza todos los modelos a la vez
    await sequelize.sync({ alter: true }); 
    console.log('📦 Todos los modelos (Usuarios, Recursos, Reservas) sincronizados.');

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

iniciarServidor();