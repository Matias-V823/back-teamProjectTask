import type { Request, Response } from "express"
import colors from 'colors'
import Project from "../models/Project"
import Task from '../models/Task'
import Sprint from '../models/SprintBacklog'

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
                    { manager: req.user.id },
                    { team: { $in: req.user.id } }

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
            if (project.manager.toString() !== req.user.id.toString() && !project.team.includes(req.user.id)) {
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

    static async metrics(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user!._id
            const projects = await Project.find({
                $or: [
                    { manager: userId },
                    { team: userId }
                ]
            }).select('_id projectName manager team')

            const projectIds = projects.map(p => p._id)

            const [sprints, tasks] = await Promise.all([
                Sprint.find({ project: { $in: projectIds } }).select('project status startDate endDate createdAt'),
                Task.find({ project: { $in: projectIds } }).select('project status sprint updatedAt createdAt')
            ])

            const today = new Date()
            const data = projects.map(p => {
                const pSprints = sprints.filter(s => String(s.project) === String(p._id))
                const pTasks = tasks.filter(t => String(t.project) === String(p._id))

                const statusCount = pTasks.reduce<Record<string, number>>((acc, t) => {
                    acc[t.status] = (acc[t.status] || 0) + 1
                    return acc
                }, {})

                const totalTasks = pTasks.length
                const completed = statusCount['completed'] || 0
                const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0

                const endedSprints = pSprints.filter(s => s.endDate < today)
                const overdueInSprint = endedSprints.reduce<number>((acc, s) => {
                    const overdue = pTasks.filter(t => String(t.sprint) === String(s._id) && t.status !== 'completed').length
                    return acc + overdue
                }, 0)

                return {
                    projectId: p._id,
                    projectName: p.projectName,
                    teamSize: p.team.length,
                    sprints: {
                        total: pSprints.length,
                        active: pSprints.filter(s => s.status === 'active').length,
                        completed: pSprints.filter(s => s.status === 'completed').length,
                        planned: pSprints.filter(s => s.status === 'planned').length
                    },
                    tasks: {
                        total: totalTasks,
                        ...statusCount,
                        overdueInSprint,
                        progress
                    }
                }
            })

            res.json({ projects: data })
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ error: 'Error al obtener métricas' })
        }
    }

    static async perProjectMetrics(req: Request, res: Response): Promise<void> {
        try {
            const project = req.project!
            const [pSprints, pTasks] = await Promise.all([
                Sprint.find({ project: project._id }).select('status startDate endDate createdAt'),
                Task.find({ project: project._id }).select('status sprint updatedAt createdAt')
            ])
            const statusCount = pTasks.reduce<Record<string, number>>((acc, t) => {
                acc[t.status] = (acc[t.status] || 0) + 1
                return acc
            }, {})
            const totalTasks = pTasks.length
            const completed = statusCount['completed'] || 0
            const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0

            const today = new Date()
            const endedSprints = pSprints.filter(s => s.endDate < today)
            const overdueInSprint = endedSprints.reduce<number>((acc, s) => {
                const overdue = pTasks.filter(t => String(t.sprint) === String(s._id) && t.status !== 'completed').length
                return acc + overdue
            }, 0)

            res.json({
                projectId: project._id,
                projectName: project.projectName,
                teamSize: project.team.length,
                sprints: {
                    total: pSprints.length,
                    active: pSprints.filter(s => s.status === 'active').length,
                    completed: pSprints.filter(s => s.status === 'completed').length,
                    planned: pSprints.filter(s => s.status === 'planned').length
                },
                tasks: {
                    total: totalTasks,
                    ...statusCount,
                    overdueInSprint,
                    progress
                }
            })
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ error: 'Error al obtener métricas del proyecto' })
        }
    }
}