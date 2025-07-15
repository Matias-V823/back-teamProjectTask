import type { Request, Response } from 'express';
import User from '../models/User';
import colors from 'colors'
import { checkPassword, hashPassword } from '../utils/auth';
import Token from '../models/Token';
import { generateToken } from '../utils/token';
import { transporter } from '../config/nodemailer';
import { AuthEmail } from '../emails/AuthEmail';
import { generateJWT } from '../utils/jwt';


export class AuthController {
    static createAccount = async (req: Request, res: Response): Promise<any> => {
        try {
            const { password, email } = req.body

            //prevenir duplicados
            const userExist = await User.findOne({ email })
            if (userExist) {
                const error = new Error('El usuario ya está registrado')
                return res.status(409).json({ error: error.message })
            }
            const user = new User(req.body)
            user.password = await hashPassword(password)
            // Genera token
            const token = new Token()
            token.token = generateToken()
            token.user = user.id

            // Enviar email
            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            await Promise.allSettled([user.save(), token.save()])
            res.status(201).json({ message: 'Cuenta creada, revisa tu email para confirmarla.' });
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error al iniciar sesion' });
        }
    }
    static confirmAccount = async (req: Request, res: Response): Promise<any> => {
        try {
            const { token } = req.body
            const tokenExist = await Token.findOne({ token })
            if (!tokenExist) {
                const error = new Error('Token no valido')
                return res.status(404).json({ error: error.message })
            }
            const user = await User.findById(tokenExist.user)
            user.confirmed = true
            await Promise.allSettled([
                user.save(),
                tokenExist.deleteOne()
            ])

            res.status(201).json({ message: 'Cuenta confirmada correctamente' });
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error al iniciar sesion' });
        }
    }


    static loginAccount = async (req: Request, res: Response): Promise<any> => {
        try {
            const { email, password } = req.body
            const user = await User.findOne({ email: email })
            if (!user) {
                const error = new Error('Usuario no encontrado')
                return res.status(404).json({ error: error.message })
            }
            if (!user.confirmed) {
                const token = new Token()
                token.token = generateToken()
                token.user = user.id

                await token.save()

                // Enviar email
                AuthEmail.sendConfirmationEmail({
                    email: user.email,
                    name: user.name,
                    token: token.token
                })

                const error = new Error('La cuenta no ha sido confirmada, hemos enviado un correo de confirmación a tu email')
                return res.status(401).json({ error: error.message })
            }
            const isPasswordCorrect = await checkPassword(password, user.password)
            if (!isPasswordCorrect) {
                const error = new Error('Contraseña incorrecta')
                return res.status(401).json({ error: error.message })
            }
            const token = generateJWT({id: user.id})

            res.send(token)

        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error al iniciar sesion' });
        }
    }

    static newToken = async (req: Request, res: Response): Promise<any> => {
        try {
            const { email } = req.body
            const user = await User.findOne({ email: email })
            if (!user) {
                const error = new Error('Usuario no registrado')
                return res.status(404).json({ error: error.message })
            }

            if (user.confirmed) {
                const error = new Error('El usuario ya esta confirmado')
                return res.status(409).json({ error: error.message })
            }

            const token = new Token()
            token.token = generateToken()
            token.user = user.id

            // Enviar email
            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            await Promise.allSettled([user.save(), token.save()])
            res.status(201).json({ message: 'Cuenta confirmada correctamente' });
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error al iniciar sesion' });
        }
    }
    static requestConfirmationCode = async (req: Request, res: Response): Promise<any> => {
        try {
            const { email } = req.body

            //prevenir duplicados
            const user = await User.findOne({ email })
            if (!user) {
                const error = new Error('El usuario no está registrado')
                return res.status(409).json({ error: error.message })
            }
            if (user.confirmed) {
                const error = new Error('El usuario ya está confirmado')
                return res.status(403).json({ error: error.message })
            }

            const token = new Token()
            token.token = generateToken()
            token.user = user.id

            // Enviar email
            AuthEmail.sendConfirmationEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            await Promise.allSettled([token.save()])
            res.status(201).json({ message: 'Se envío un nuevo token, revisa tu email para confirmarla.' });
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error crear nuevo token' });
        }
    }
    static forgotPassword = async (req: Request, res: Response): Promise<any> => {
        try {
            const { email } = req.body

            //prevenir duplicados
            const user = await User.findOne({ email })
            if (!user) {
                const error = new Error('El usuario no está registrado')
                return res.status(409).json({ error: error.message })
            }

            const token = new Token()
            token.token = generateToken()
            token.user = user.id

            await Promise.allSettled([token.save()])
            // Enviar email
            AuthEmail.forgotPasswordEmail({
                email: user.email,
                name: user.name,
                token: token.token
            })

            res.status(201).json({ message: 'Revisa el email y sigue las instrucciones.' });
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error crear nuevo token' });
        }
    }
    static validateTokenPassword = async (req: Request, res: Response): Promise<any> => {
        try {
            const { token } = req.body

            //prevenir duplicados
            const tokenExist = await Token.findOne({ token })
            if (!tokenExist) {
                const error = new Error('Token no valido')
                return res.status(409).json({ error: error.message })
            }

            res.status(201).json({ message: 'Token valido, Define tu nuevo password' });
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error crear nuevo token' });
        }
    }
    static updatePasswordWithToken = async (req: Request, res: Response): Promise<any> => {
        try {
            const { token } = req.params
            const { password, password_confirmation } = req.body

            const tokenExist = await Token.findOne({ token })
            if (!tokenExist) { 
                const error = new Error('Token no valido')
                return res.status(409).json({ error: error.message })
            }

            const user = await User.findById(tokenExist.user)
            user.password = await hashPassword(password),


            await Promise.allSettled([user.save(), tokenExist.deleteOne()])
            res.status(201).json({ message: 'Contraseña actualizada correctamente, vuelve a iniciar sesión' });
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error crear nuevo token' });
        }
    }
}