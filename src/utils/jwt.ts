import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { Types } from 'mongoose'

dotenv.config()

type userPayload = {
    id: Types.ObjectId
}

export const generateJWT = (payload : userPayload) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn:'5m'
    })
    return token
}