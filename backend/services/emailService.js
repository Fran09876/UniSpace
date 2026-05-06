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

  const enviarCorreoRecuperacion = async (correo, codigo) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: correo,
      subject: 'Código de recuperación - UniSpace',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
          <h2 style="color: #111; text-align: center;">Recuperación de Cuenta</h2>
          <p style="color: #555;">Has solicitado restablecer tu contraseña. Usa el siguiente código:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 10px;">
            <span style="font-size: 24px; font-bold; letter-spacing: 5px; color: #000;">${codigo}</span>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">Este código expirará en 15 minutos.</p>
        </div>
      `
    };
    return transporter.sendMail(mailOptions);
  };

module.exports = {
  enviarCorreoReserva,
  enviarCorreoRecuperacion
};
