import type { Request, Response } from "express"
import colors from 'colors'
import Project from "../models/Project"


export class ProjectController {
    static createProject = async (req: Request, res: Response) => {
        try {
           await Project.create(req.body)
        } catch (error) {
            console.log(colors.red.bold(error))
        }
    }
    static getAllProjects = async (req: Request, res: Response) => {
        try {
            const project = await Project.find({})
            res.json(project)
        } catch (error) {
            console.log(colors.red.bold(error))
        }
    }
}