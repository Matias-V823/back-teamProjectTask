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
                Sprint.find({ project: project._id }).select('name startDate endDate createdAt status').sort({ endDate: 1 }),
                User.find({ _id: { $in: project.team } }).select('name role')
            ])

            const backlogStatus = tasks.reduce<Record<string, number>>((acc, t) => {
                acc[t.status] = (acc[t.status] || 0) + 1
                return acc
            }, {})
            const backlogTotal = tasks.length
            backlogStatus.total = backlogTotal

            const today = new Date()

            const datedSprints = sprints.filter(s => s.startDate && s.endDate)
            const activeSprint = datedSprints.find(s =>
                s.startDate <= today && today <= s.endDate
            ) || null

            let sprintMetrics: any = { hasActive: false }

            if (activeSprint) {
                const sprintTasks = tasks.filter(t => t.sprint?.toString() === activeSprint._id.toString())
                const totalTasks = sprintTasks.length
                const completed = sprintTasks.filter(t => t.status === 'completed').length
                const progress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0

                const daysTotal = Math.max(
                    1,
                    Math.ceil(
                        (activeSprint.endDate.getTime() - activeSprint.startDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                )
                const daysRemaining = Math.max(
                    0,
                    Math.ceil(
                        (activeSprint.endDate.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                )

                // --- BURN DOWN / BURN UP ---
                const burnDown: { date: string; idealRemaining: number; actualRemaining: number }[] = []
                const burnUp: { date: string; idealCompleted: number; actualCompleted: number }[] = []

                for (let i = 0; i <= daysTotal; i++) {
                    const d = new Date(activeSprint.startDate)
                    d.setDate(d.getDate() + i)
                    const dateStr = d.toISOString().slice(0, 10)

                    const ratio = daysTotal === 0 ? 1 : i / daysTotal
                    const idealRemaining = Math.max(0, Math.round(totalTasks * (1 - ratio)))
                    const idealCompleted = Math.min(totalTasks, Math.round(totalTasks * ratio))

                    const completedUntilDate = sprintTasks.filter(t =>
                        t.status === 'completed' &&
                        t.updatedAt.toISOString().slice(0, 10) <= dateStr
                    ).length
                    const actualCompleted = completedUntilDate
                    const actualRemaining = Math.max(0, totalTasks - actualCompleted)

                    burnDown.push({ date: dateStr, idealRemaining, actualRemaining })
                    burnUp.push({ date: dateStr, idealCompleted, actualCompleted })
                }

                sprintMetrics = {
                    hasActive: true,
                    name: activeSprint.name,
                    startDate: activeSprint.startDate,
                    endDate: activeSprint.endDate,
                    totalTasks,
                    completed,
                    progress,
                    daysTotal,
                    daysRemaining,
                    burnDown,
                    burnUp
                }
            }

            const completedSprints = datedSprints
                .filter(s => s.endDate < today)
                .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())

            let lastCompletedSprint: any = null
            if (completedSprints.length > 0) {
                const last = completedSprints[0]
                const lastTasks = tasks.filter(t => t.sprint?.toString() === last._id.toString())
                const unfinished = lastTasks.filter(t => t.status !== 'completed').length
                lastCompletedSprint = {
                    name: last.name,
                    endDate: last.endDate,
                    unfinishedTasks: unfinished
                }
            }

            const days: { date: string; completed: number }[] = []
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today)
                d.setDate(today.getDate() - i)
                const dateStr = d.toISOString().slice(0, 10)
                const completedThatDay = tasks.filter(t =>
                    t.status === 'completed' &&
                    t.updatedAt.toISOString().slice(0, 10) === dateStr
                ).length

                days.push({ date: dateStr, completed: completedThatDay })
            }

            const members = teamUsers.map(u => {
                const memberTasks = tasks.filter(t => t.assignedTo?.toString() === u._id.toString())
                const mTotal = memberTasks.length
                const mCompleted = memberTasks.filter(t => t.status === 'completed').length
                const completionRate = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0

                const statusTotals = memberTasks.reduce<Record<string, number>>((acc, t) => {
                    acc[t.status] = (acc[t.status] || 0) + 1
                    return acc
                }, {})

                return {
                    id: u._id,
                    name: u.name,
                    role: u.role,
                    completionRate,
                    totals: {
                        total: mTotal,
                        pending: statusTotals.pending || 0,
                        onHold: statusTotals.onHold || 0,
                        inProgress: statusTotals.inProgress || 0,
                        underReview: statusTotals.underReview || 0,
                        completed: statusTotals.completed || 0
                    }
                }
            })

            const unassignedTasks = tasks.filter(t => !t.assignedTo).length

            res.json({
                projectId: project._id,
                projectName: project.projectName,
                teamSize: project.team.length,
                backlogStatus,
                sprint: sprintMetrics,
                throughput7d: days,
                members,
                unassignedTasks,
                lastCompletedSprint
            })
        } catch (error) {
            console.log(colors.red.bold(error))
            res.status(500).json({ error: 'Error al obtener métricas del proyecto' })
        }
    }
}