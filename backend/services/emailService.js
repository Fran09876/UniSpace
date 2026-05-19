const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const enviarCorreoReserva = async ({ to, nombre, estado, reserva, motivo }) => {
  try {
    const estadoTexto = estado === 'confirmada' ? 'confirmada' : 'rechazada';
    const asunto = estado === 'confirmada'
      ? '✅ Reserva confirmada - UniSpace'
      : '❌ Reserva rechazada - UniSpace';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
        <h2 style="color: #111;">Hola ${nombre},</h2>
        <p style="font-size: 16px;">Tu solicitud de reserva ha sido <b style="color: ${estado === 'confirmada' ? '#16a34a' : '#dc2626'};">${estadoTexto}</b>.</p>

        <div style="background: #f9fafb; padding: 15px; border-radius: 10px; margin: 20px 0;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><b>📍 Espacio:</b> ${reserva.Recurso?.nombre || 'No especificado'}</li>
            <li style="margin-bottom: 8px;"><b>📅 Fecha:</b> ${reserva.fecha}</li>
            <li style="margin-bottom: 8px;"><b>⏰ Hora:</b> ${reserva.hora_inicio} - ${reserva.hora_fin}</li>
          </ul>
        </div>

        ${estado === 'cancelada' && motivo ? `
        <div style="border-left: 4px solid #dc2626; padding-left: 15px; margin-top: 20px;">
          <p style="margin-bottom: 5px; font-weight: bold; color: #dc2626;">Motivo del rechazo:</p>
          <p style="color: #4b5563; font-style: italic;">"${motivo}"</p>
        </div>
        ` : ''}

        <p style="margin-top: 25px; color: #9ca3af; font-size: 12px; text-align: center;">
          Este es un mensaje automático, por favor no respondas a este correo.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"UniSpace" <${process.env.EMAIL_USER}>`,
      to,
      subject: asunto,
      html
    });

    console.log('📧 Correo enviado a:', to, '| Motivo incluido:', !!motivo);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo de reserva:', error);
    return false;
  }
};

const enviarCorreoRecuperacion = async (correo, codigo) => {
  try {
    const mailOptions = {
      from: `"UniSpace" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: 'Código de recuperación - UniSpace',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
          <h2 style="color: #111; text-align: center;">Recuperación de Cuenta</h2>
          <p style="color: #555; text-align: center;">Has solicitado restablecer tu contraseña. Usa el siguiente código:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #000;">${codigo}</span>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">Este código expirará en 15 minutos.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('📧 Correo de recuperación enviado a:', correo);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo de recuperación:', error);
    return false;
  }
};

module.exports = {
  enviarCorreoReserva,
  enviarCorreoRecuperacion
};