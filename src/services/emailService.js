import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendPasswordResetEmail(to, code) {
  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_SENDER_EMAIL,
      name: 'CorpSync'
    },
    subject: 'Redefinição de senha',
    text: `Seu código de verificação é: ${code}`,
  };

  await sgMail.send(msg);
}
