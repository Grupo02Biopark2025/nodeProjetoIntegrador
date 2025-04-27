import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendPasswordResetEmail(to, resetCode) {
  const msg = {
    to,
    from: process.env.EMAIL_FROM,
    subject: "Seu Código de Recuperação - CorpSync",
    html: `
      <h2>Recuperação de Senha</h2>
      <p>Seu código de recuperação é:</p>
      <h1 style="letter-spacing: 4px;">${resetCode}</h1>
      <p>Este código expira em 10 minutos.</p>
    `,
  };

  await sgMail.send(msg);
}
