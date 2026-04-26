// index.js
const express   = require('express');
const cors      = require('cors');
const sequelize = require('./database');

// 1. Importar modelos
const Usuario = require('./models/Usuario');
const Recurso = require('./models/Recurso');
const Reserva = require('./models/Reserva');

// 2. Asociaciones — deben definirse ANTES de importar rutas
Usuario.hasMany(Reserva, { foreignKey: 'id_usuario' });
Recurso.hasMany(Reserva, { foreignKey: 'id_recurso' });
Reserva.belongsTo(Usuario, { foreignKey: 'id_usuario' });
Reserva.belongsTo(Recurso, { foreignKey: 'id_recurso' });

// 3. Rutas
const authRoutes    = require('./routes/authRoutes');
const recursoRoutes = require('./routes/recursoRoutes');
const reservaRoutes = require('./routes/reservaRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/recursos', recursoRoutes);
app.use('/api/reservas', reservaRoutes);

app.get('/', (_req, res) => {
  res.json({ mensaje: 'API de UniSpace en línea.' });
});

// Manejador de errores global — garantiza que SIEMPRE se devuelva JSON,
// nunca HTML. Esto evita el error "token inesperado '<'" en el frontend.
app.use((err, _req, res, _next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ mensaje: 'Error interno del servidor.', detalle: err.message });
});

const iniciarServidor = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida.');

    // sync({ alter: false }) — la DB ya existe con la estructura correcta (UUID).
    // alter:true en PostgreSQL + ENUMs puede lanzar errores. Lo evitamos.
    await sequelize.sync({ alter: false });
    console.log('📦 Modelos sincronizados con la base de datos.');

    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});
iniciarServidor();