const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const enviarCorreoReserva = async ({ to, nombre, estado, reserva }) => {
  try {
    const asunto =
      estado === 'confirmada'
        ? '✅ Reserva confirmada'
        : '❌ Reserva rechazada';

    const html = `
      <h2>Hola ${nombre}</h2>
      <p>Tu solicitud de reserva ha sido <b>${estado}</b>.</p>

      <ul>
        <li><b>Espacio:</b> ${reserva.Recurso?.nombre}</li>
        <li><b>Fecha:</b> ${reserva.fecha}</li>
        <li><b>Hora:</b> ${reserva.hora_inicio} - ${reserva.hora_fin}</li>
      </ul>

      <p>Gracias por usar el sistema.</p>
    `;

    await transporter.sendMail({
      from: `"UniSpace" <${process.env.EMAIL_USER}>`,
      to,
      subject: asunto,
      html
    });

    console.log('📧 Correo enviado a:', to);

    return true;
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    return false;
  }
};

module.exports = { enviarCorreoReserva };