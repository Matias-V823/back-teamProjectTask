import type { Request, Response } from "express";
import User from "../models/User";

export class TeamMemberController {
    static findMemberByEmail = async (req: Request, res: Response) : Promise<any> => {
        const { email } = req.body;

        // Find User
        const user = await User.findOne({ email }).select('-password -__v -createdAt -updatedAt');
        res.json(user);
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

    }
}