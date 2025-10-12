import mongoose, { Schema, Document } from 'mongoose'


export interface IUser extends Document {
    email: string
    password: string
    name: string
    confirmed: boolean
    role: UserRole
    developerProfile?: IDeveloperProfile
}

export const userRoles = {
    SCRUM_MASTER: 'Scrum Master',
    PRODUCT_OWNER: 'Product Owner',
    SCRUM_TEAM: 'Scrum Team'
} as const
export type UserRole = typeof userRoles[keyof typeof userRoles]

export const developerStrengths = {
    FRONTEND: 'frontend',
    BACKEND: 'backend',
    DATABASE: 'database',
    TESTING: 'testing'
} as const
export type DeveloperStrength = typeof developerStrengths[keyof typeof developerStrengths]

export interface IDeveloperProfile {
    yearsExperience: number
    technologies: string[]
    strengths: DeveloperStrength[]
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
    },
    role: {
        type: String,
        enum: Object.values(userRoles),
        required: true,
        default: userRoles.SCRUM_TEAM
    },
    developerProfile: {
        yearsExperience: { type: Number, min: 0, default: 0 },
        technologies: { type: [String], default: [] },
        strengths: [{ type: String, enum: Object.values(developerStrengths), default: undefined }]
    }
})

const User = mongoose.model<IUser>('user', UserScheema)
export default User