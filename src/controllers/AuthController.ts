import colors from 'colors'
import { Request, Response } from 'express';
import User from '../models/User';


export class AuthController {
    static createAccount = async (req: Request, res: Response) => {
        try {
            const user = new User(req.body)
            await user.save()
            res.status(201).json({ message: 'Cuenta creada, revisa tu email para confirmarla.' });
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error al iniciar sesion' });
        }
    }
}