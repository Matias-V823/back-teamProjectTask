import { transporter } from "../config/nodemailer"

interface IEmail {
    email: string
    name: string
    token: string
}

export class AuthEmail {
    static sendConfirmationEmail = async (user: IEmail) => {
        await transporter.sendMail({
            from: 'admin <admin@explobyte.com>',
            to: user.email,
            subject: 'teamProjectTask - Confirma tu cuenta',
            text: `Confirma tu cuenta para hacer uso de la plataforma: ${process.env.FRONTEND_URL}/auth/confirmar-cuenta?token=${user.token}`,
            html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirma tu cuenta</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background-color: #2563eb;
                        padding: 20px;
                        text-align: center;
                        border-radius: 8px 8px 0 0;
                    }
                    .header h1 {
                        color: white;
                        margin: 0;
                        font-size: 24px;
                    }
                    .content {
                        padding: 30px;
                        background-color: #f9fafb;
                        border-left: 1px solid #e5e7eb;
                        border-right: 1px solid #e5e7eb;
                    }
                    .footer {
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #6b7280;
                        background-color: #f3f4f6;
                        border-radius: 0 0 8px 8px;
                        border-left: 1px solid #e5e7eb;
                        border-right: 1px solid #e5e7eb;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #2563eb;
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: bold;
                        margin: 20px 0;
                    }
                    .button:hover {
                        background-color: #1d4ed8;
                    }
                    .code {
                        font-family: monospace;
                        background-color: #e5e7eb;
                        padding: 2px 4px;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Bienvenido a teamProjectTask</h1>
                </div>
                
                <div class="content">
                    <p>Hola ${user.name},</p>
                    
                    <p>¡Gracias por registrarte en nuestra plataforma! Para completar tu registro, por favor confirma tu cuenta haciendo clic en el siguiente botón:</p>
                    
                    <p style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL}/auth/confirmar-cuenta?token=${user.token}" class="button">
                            Confirmar mi cuenta
                        </a>
                    </p>
                    
                    <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
                    
                    <p><a href="${process.env.FRONTEND_URL}/auth/confirmar-cuenta?token=${user.token}">
                        ${process.env.FRONTEND_URL}/auth/confirmar-cuenta?token=${user.token}
                    </a></p>
                    
                    <p>Si no has solicitado este registro, por favor ignora este mensaje.</p>
                </div>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} teamProjectTask. Todos los derechos reservados.</p>
                    <p>Si necesitas ayuda, contáctanos en <a href="mailto:soporte@explobyte.com">soporte@explobyte.com</a></p>
                </div>
            </body>
            </html>
            `
        })
    }
}