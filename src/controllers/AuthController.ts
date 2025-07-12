import type { Request, Response } from 'express';
import User from '../models/User';
import colors from 'colors'
import { hashPassword } from '../utils/auth';
import Token from '../models/Token';
import { generateToken } from '../utils/token';


export class AuthController {
    static createAccount = async (req: Request, res: Response): Promise<any> => {
        try {
            const { password, email } = req.body

            //prevenir duplicados
            const userExist = await User.findOne({ email })
            if (userExist) {
                const error = new Error('El usuario ya está registrado')
                return res.status(409).json({error: error.message})
            }



            const user = new User(req.body)
            user.password = await hashPassword(password)
            // Genera token
            const token = new Token()
            token.token = generateToken()
            token.user = user.id 

            await Promise.allSettled([user.save(), token.save()])
            res.status(201).json({ message: 'Cuenta creada, revisa tu email para confirmarla.' });
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error al iniciar sesion' });
        }
    }
}