import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendPasswordResetEmail(to, token) {
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  const email = {
    to,
    from: process.env.EMAIL_FROM,
    subject: "Redefinição de Senha",
    html: `
      <p>Olá!</p>
      <p>Para redefinir sua senha, clique no link abaixo:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Este link expira em 15 minutos.</p>
    `,
  };

  try {
    await sgMail.send(email);
    console.log(`E-mail enviado para ${to}`);
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw error;
  }
}
