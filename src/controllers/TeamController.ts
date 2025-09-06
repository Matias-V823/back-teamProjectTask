import type { Request, Response } from "express";
import User from "../models/User";

export class TeamMemberController {
    static findMemberByEmail = async (req: Request, res: Response): Promise<any> => {
        const { email } = req.body;

        // Find User
        const user = await User.findOne({ email }).select('-password -__v -createdAt -updatedAt');
        res.json(user);
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

    }

    static addMemberById = async (req: Request, res: Response): Promise<any> => {
        const { id } = req.body;
        const user = await User.findById(id).select('id');
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        if (req.project.team.some(team => team.toString() === user.id.toString())) {
            return res.status(409).json({ msg: 'El usuario ya pertenece al equipo del proyecto' });
        }

        req.project.team.push(user.id);
        await req.project.save();

        res.send('Miembro agregado al equipo correctamente');

    }
}