import nodemailer from 'nodemailer'

// Configurazione email (in produzione, usa variabili d'ambiente)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-password',
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // In sviluppo, registra semplicemente l'email
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent:', {
        to: options.to,
        subject: options.subject,
        html: options.html,
      })
      return true
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Evolvia <noreply@evolvia.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    })

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  return sendEmail({
    to: email,
    subject: 'Benvenuto in Evolvia',
    html: `
      <h1>Benvenuto in Evolvia!</h1>
      <p>Ciao ${name},</p>
      <p>Il tuo account è stato creato con successo.</p>
      <p>Puoi ora accedere alla piattaforma e iniziare a gestire le tue comunicazioni TLC.</p>
      <p>Saluti,<br>Team Evolvia</p>
    `,
  })
}

export async function sendNotificationEmail(email: string, title: string, message: string) {
  return sendEmail({
    to: email,
    subject: `Evolvia - ${title}`,
    html: `
      <h2>${title}</h2>
      <p>${message}</p>
      <p>Saluti,<br>Team Evolvia</p>
    `,
  })
}


