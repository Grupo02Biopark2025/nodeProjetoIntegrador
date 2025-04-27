import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Função para enviar o e-mail de redefinição de senha
export async function sendPasswordResetEmail(to, token) {
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  const email = {
    to,
    from: process.env.EMAIL_FROM,
    subject: "Redefinição de Senha - CorpSync",
    html: `
      <h2>Redefinição de Senha</h2>
      <p>Olá,</p>
      <p>Clique no botão abaixo para redefinir sua senha:</p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background-color:#259073;color:white;border-radius:5px;text-decoration:none;">Redefinir Senha</a>
      <p>Este link é válido por 15 minutos.</p>
    `,
  };

  await sgMail.send(email);
}
