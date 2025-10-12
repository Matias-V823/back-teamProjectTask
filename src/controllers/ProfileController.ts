import { Request, Response } from 'express'
import User, { developerStrengths, IUser, userRoles } from '../models/User'

export class ProfileController {
    static async me(req: Request, res: Response): Promise<void> {
        try {
            res.json(req.user)
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener perfil' })
        }
    }

    static async update(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user!._id
            const { name, yearsExperience, strengths } = req.body as {
                name?: string
                yearsExperience?: number
                strengths?: string[]
            }

            const update: any = {}
            if (typeof name === 'string') update.name = name
            if (typeof yearsExperience === 'number') {
                update['developerProfile.yearsExperience'] = yearsExperience
            }
            if (Array.isArray(strengths)) {
                const validStrengths = strengths.filter(s => Object.values(developerStrengths).includes(s as any))
                update['developerProfile.strengths'] = validStrengths
            }

            const updated = await User.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true }).select('-password -confirmed')
            res.json(updated)
        } catch (error) {
            res.status(500).json({ error: 'Error al actualizar perfil' })
        }
    }

    static async addTechnology(req: Request, res: Response): Promise<void> {
        try {
            const currentUser = req.user as IUser
            if (currentUser.role !== userRoles.SCRUM_TEAM) {
                res.status(403).json({ error: 'No autorizado' })
                return
            }
            const { technology } = req.body as { technology: string }
            if (!technology) {
                res.status(400).json({ error: 'technology es requerido' })
                return
            }

            const updated = await User.findByIdAndUpdate(currentUser._id, {
                $addToSet: { 'developerProfile.technologies': technology }
            }, { new: true, runValidators: true }).select('-password -confirmed')

            res.json(updated)
        } catch (error) {
            res.status(500).json({ error: 'Error al agregar tecnología' })
        }
    }

    static async removeTechnology(req: Request, res: Response): Promise<void> {
        try {
            const currentUser = req.user as IUser
            if (currentUser.role !== userRoles.SCRUM_TEAM) {
                res.status(403).json({ error: 'No autorizado' })
                return
            }
            const { technology } = req.params as { technology: string }
            if (!technology) {
                res.status(400).json({ error: 'technology es requerido' })
                return
            }

            const updated = await User.findByIdAndUpdate(currentUser._id, {
                $pull: { 'developerProfile.technologies': technology }
            }, { new: true, runValidators: true }).select('-password -confirmed')

            res.json(updated)
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar tecnología' })
        }
    }
}