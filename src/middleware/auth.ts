import { Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'
import User, { IUser } from "../models/User"
import dotenv from 'dotenv'

declare global {
    namespace Express {
        interface Request{
            user?: IUser
        }
    }
}

dotenv.config()

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization
    if (!bearer) {
        const error = new Error('Usuario no autenticado')
        res.status(401).send({ error: error.message })
        return
    }
    const token = bearer.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (typeof decoded === 'object' && decoded.id) {
            const user = await await User.findById(decoded.id).select('-password -confirmed')
            if (user) {
                req.user = user
                next()

            } else {
                res.status(500).json({ error: 'Usuario no registrado' })
            }
        }

    } catch (error) {
        res.status(500).json({ error: 'Token no válido' })
    }
}