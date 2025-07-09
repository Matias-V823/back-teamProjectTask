import mongoose, { Schema, Document } from 'mongoose'


export interface IUser extends Document {
    email: string
    password: string
    name: string
    confirmed: boolean
}

const UserScheema: Schema = new Schema({
    email: {
        type: String,
        require: true,
        lowerCase: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        require: true,
        trim: true
    },
    name: {
        type: String,
        require: true,
        trim: true
    },
    confirmed: {
        type: Boolean,
        default: false
    }
})

const User = mongoose.model<IUser>('user', UserScheema)
export default User