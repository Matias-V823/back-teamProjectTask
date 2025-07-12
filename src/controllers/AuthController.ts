import type { Request, Response } from 'express';
import bcrypt from 'bcrypt'
import User from '../models/User';
import colors from 'colors'
import { hashPassword } from '../utils/auth';


export class AuthController {
    static createAccount = async (req: Request, res: Response) => {
        try {
            const { password } = req.body
            const user = new User(req.body)
            user.password = await hashPassword(password)
            await user.save()
            res.status(201).json({ message: 'Cuenta creada, revisa tu email para confirmarla.' });
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error al iniciar sesion' });
        }
    }
}