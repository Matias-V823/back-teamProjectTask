import type { Request, Response } from "express"
import colors from 'colors'
import Project from "../models/Project"


export class ProjectController {
    static createProject = async (req: Request, res: Response) => {
        const project = new Project(req.body)
        project.manager = req.user.id
        try {
            await project.save()
            res.status(201).json({ message: 'Proyecto creado con éxito' });
        } catch (error) {
            console.log(colors.red.bold(error))
        }
    }
    static getAllProjects = async (req: Request, res: Response) => {
        try {
            const projects = await Project.find({
                $or: [
                    { manager: req.user.id }
                ]
            })
            res.json(projects)
        } catch (error) {
            console.log(colors.red.bold(error))
        }
    }
    static getProjectById = async (req: Request, res: Response): Promise<any> => {
        const { id } = req.params
        try {
            const project = await Project.findById(id).populate('tasks')
            if (!project) {
                const error = new Error('Proyecto no encontrado')
                return res.status(404).json({ error: error.message })
            }
            if (project.manager.toString() !== req.user.id.toString()) {
                const error = new Error('Acción no válida')
                return res.status(404).json({ error: error.message })
            }
            res.json(project)
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ message: 'Error del servidor' });
        }
    }
    static updateProject = async (req: Request, res: Response): Promise<any> => {
        try {
            const project = await Project.findById(req.params.id)
            if (!project) {
                const error = new Error('Proyecto no encontrado')
                return res.status(404).json({ error: error.message })
            }
            if (project.manager.toString() !== req.user.id.toString()) {
                const error = new Error('Solo el manager puede actualizar el proyecto')
                return res.status(404).json({ error: error.message })
            }
            project.clientName = req.body.clientName
            project.projectName = req.body.projectName
            project.description = req.body.description
            await project.save()
            res.send('Proyecto actualizado')
        } catch (error) {
            console.log(colors.red.bold(error))
        }
    }
    static deleteProject = async (req: Request, res: Response) => {
        try {
            const project = await Project.findById(req.params.id)
            if (project.manager.toString() !== req.user.id.toString()) {
                const error = new Error('Solo el manager puede eliminar un proyecto')
                res.status(404).json({ error: error.message })
                return
            }
            await project.deleteOne()
            res.send('Proyecto eliminado')
        } catch (error) {
            console.log(colors.red.bold(error))
        }
    }
}