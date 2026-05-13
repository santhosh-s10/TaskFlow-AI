import nodemailer from "nodemailer"

type SendPasswordResetEmailInput = {
  to: string
  resetUrl: string
}

export async function sendPasswordResetEmail({ to, resetUrl }: SendPasswordResetEmailInput) {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.EMAIL_FROM ?? user

  if (!host || !user || !pass || !from) {
    console.info(`[password-reset] Reset link for ${to}: ${resetUrl}`)
    return
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your TaskFlow AI password",
    text: `Use this link to reset your TaskFlow AI password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h1 style="font-size:20px">Reset your password</h1>
        <p>Use the button below to create a new password for your TaskFlow AI account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#111827;color:#ffffff;padding:10px 14px;border-radius:6px;text-decoration:none">
            Reset password
          </a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
        <p style="font-size:12px;color:#6b7280">This link expires in 1 hour.</p>
      </div>
    `,
  })
}
