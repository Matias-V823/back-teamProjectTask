import type { Request, Response } from "express";
import User from "../models/User";
import Project from "../models/Project";

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

    static deleteMember = async (req: Request, res: Response): Promise<any> => {
        const { id } = req.body;

        if (!req.project.team.some(team => team.toString() === id)) {
            return res.status(409).json({ msg: 'No pertenece a equipo' });
        }

        req.project.team = req.project.team.filter(team => team.toString() !== id);
        await req.project.save();
        res.send('Miembro eliminado del equipo correctamente');
    }

    static getMembers = async (req: Request, res: Response): Promise<any> => {
        const project = await Project.findById(req.project.id).select('team').populate('team', '-password -__v -createdAt -updatedAt -projects -tasks');
        res.json(project.team);
    }
}