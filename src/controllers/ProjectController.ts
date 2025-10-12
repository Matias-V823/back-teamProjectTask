import type { Request, Response } from "express"
import colors from 'colors'
import Project from "../models/Project"
import Task from '../models/Task'
import Sprint from '../models/SprintBacklog'
import User from '../models/User'

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

    static async reportMetrics(req: Request, res: Response): Promise<void> {
        try {
            const project = req.project!

            const [tasks, sprints, teamUsers] = await Promise.all([
                Task.find({ project: project._id }).select('status sprint assignedTo updatedAt createdAt'),
                Sprint.find({ project: project._id }).select('name status startDate endDate createdAt').sort({ endDate: 1 }),
                User.find({ _id: { $in: project.team } }).select('name role')
            ])

            const backlogStatus = tasks.reduce<Record<string, number>>((acc, t) => {
                acc[t.status] = (acc[t.status] || 0) + 1
                return acc
            }, {})
            const backlogTotal = tasks.length

            const activeSprint = sprints.find(s => s.status === 'active') || null
            let sprintMetrics: any = { hasActive: false }
            if (activeSprint) {
                const sprintTasks = tasks.filter(t => String(t.sprint) === String(activeSprint._id))
                const sprintCompleted = sprintTasks.filter(t => t.status === 'completed').length
                const total = sprintTasks.length
                const progress = total > 0 ? Math.round((sprintCompleted / total) * 100) : 0
                const daysTotal = Math.max(1, Math.ceil((activeSprint.endDate.getTime() - activeSprint.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                const daysRemaining = Math.max(0, Math.ceil((activeSprint.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

                const seriesDates: Date[] = []
                const start = new Date(activeSprint.startDate)
                const end = new Date(activeSprint.endDate)
                start.setHours(0,0,0,0)
                end.setHours(0,0,0,0)
                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    seriesDates.push(new Date(d))
                }
                const denom = Math.max(1, seriesDates.length - 1)
                let cumulativeCompleted = 0
                const burnDown = seriesDates.map((d, idx) => {
                    const dayEnd = new Date(d)
                    dayEnd.setHours(23,59,59,999)
                    const completedUpToDay = sprintTasks.filter(t => t.status === 'completed' && t.updatedAt <= dayEnd).length
                    cumulativeCompleted = Math.max(cumulativeCompleted, completedUpToDay)
                    const idealRemaining = Math.max(0, Math.round(total - (total * (idx / denom))))
                    const actualRemaining = Math.max(0, total - cumulativeCompleted)
                    return {
                        date: d.toISOString().slice(0,10),
                        idealRemaining,
                        actualRemaining
                    }
                })
                const burnUp = seriesDates.map((d, idx) => {
                    const dayEnd = new Date(d)
                    dayEnd.setHours(23,59,59,999)
                    const completedUpToDay = sprintTasks.filter(t => t.status === 'completed' && t.updatedAt <= dayEnd).length
                    const idealCompleted = Math.min(total, Math.round(total * (idx / denom)))
                    return {
                        date: d.toISOString().slice(0,10),
                        idealCompleted,
                        actualCompleted: completedUpToDay
                    }
                })

                sprintMetrics = {
                    hasActive: true,
                    name: activeSprint.name,
                    startDate: activeSprint.startDate,
                    endDate: activeSprint.endDate,
                    totalTasks: total,
                    completed: sprintCompleted,
                    progress,
                    daysTotal,
                    daysRemaining,
                    burnDown,
                    burnUp
                }
            }

            const completedSprints = sprints.filter(s => s.status === 'completed').sort((a, b) => b.endDate.getTime() - a.endDate.getTime())
            let lastCompletedSprint: any = null
            if (completedSprints.length > 0) {
                const last = completedSprints[0]
                const sprintTasks = tasks.filter(t => String(t.sprint) === String(last._id))
                const unfinished = sprintTasks.filter(t => t.status !== 'completed').length
                lastCompletedSprint = { name: last.name, endDate: last.endDate, unfinishedTasks: unfinished }
            }

            const days: { date: string; completed: number }[] = []
            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const yyyy = date.getFullYear()
                const mm = String(date.getMonth() + 1).padStart(2, '0')
                const dd = String(date.getDate()).padStart(2, '0')
                const key = `${yyyy}-${mm}-${dd}`
                const startD = new Date(yyyy, date.getMonth(), date.getDate(), 0, 0, 0)
                const endD = new Date(yyyy, date.getMonth(), date.getDate(), 23, 59, 59)
                const completedCount = tasks.filter(t => t.status === 'completed' && t.updatedAt >= startD && t.updatedAt <= endD).length
                days.push({ date: key, completed: completedCount })
            }

            const scrumTeam = teamUsers.filter(u => u.role === 'Scrum Team')
            const members = scrumTeam.map(u => {
                const myTasks = tasks.filter(t => String(t.assignedTo) === String(u._id))
                const totals = myTasks.reduce<Record<string, number>>((acc, t) => {
                    acc[t.status] = (acc[t.status] || 0) + 1
                    return acc
                }, {})
                const total = myTasks.length
                const mCompleted = totals['completed'] || 0
                const completionRate = total > 0 ? Math.round((mCompleted / total) * 100) : 0
                return {
                    id: u._id,
                    name: u.name,
                    role: u.role,
                    totals: {
                        total,
                        pending: totals['pending'] || 0,
                        onHold: totals['onHold'] || 0,
                        inProgress: totals['inProgress'] || 0,
                        underReview: totals['underReview'] || 0,
                        completed: mCompleted
                    },
                    completionRate
                }
            })

            const unassignedTasks = tasks.filter(t => !t.assignedTo).length

            res.json({
                projectId: project._id,
                projectName: project.projectName,
                teamSize: project.team.length,
                backlogStatus: { ...backlogStatus, total: backlogTotal },
                sprint: sprintMetrics,
                throughput7d: days,
                members,
                unassignedTasks,
                lastCompletedSprint
            })
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ error: 'Error al obtener métricas detalladas' })
        }
    }
}