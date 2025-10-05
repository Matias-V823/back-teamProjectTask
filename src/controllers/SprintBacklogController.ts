import { Request, Response } from 'express'
import Sprint from '../models/SprintBacklog'
import ProductBacklogItem from '../models/ProductBacklog'

export class SprintBacklogController {

  static list = async (req: Request, res: Response): Promise<void> => {
    try {
      const sprints = await Sprint.find({ project: req.project.id }).sort({ startDate: 1, createdAt: 1 })
      res.json(sprints)
    } catch {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  static create = async (req: Request, res: Response): Promise<void> => {
    try {
      // @ts-ignore defensa en profundidad
      if (req.project.manager.toString() !== req.user.id.toString()) {
        res.status(403).json({ error: 'Solo el manager puede crear sprints' })
        return
      }
      const { name, startDate, endDate } = req.body as { name: string, startDate: string, endDate: string }
      if (!name || !startDate || !endDate) {
        res.status(400).json({ error: 'Datos incompletos' })
        return
      }
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        res.status(400).json({ error: 'Rango de fechas inválido' })
        return
      }
      const sprint = new Sprint({
        project: req.project.id,
        name: name.trim(),
        startDate: start,
        endDate: end,
        stories: []
      })
      await sprint.save()
      res.status(201).json(sprint)
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Hubo un error' })
    }
  }

  static getOne = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sprintId } = req.params
      const sprint = await Sprint.findById(sprintId)
      if (!sprint || sprint.project.toString() !== req.project.id.toString()) {
        res.status(404).json({ error: 'Sprint no encontrado' })
        return
      }
      res.json(sprint)
    } catch {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  static update = async (req: Request, res: Response): Promise<void> => {
    try {
      // @ts-ignore
      if (req.project.manager.toString() !== req.user.id.toString()) {
        res.status(403).json({ error: 'Solo el manager puede actualizar el sprint' })
        return
      }
      const { sprintId } = req.params
      const sprint = await Sprint.findById(sprintId)
      if (!sprint || sprint.project.toString() !== req.project.id.toString()) {
        res.status(404).json({ error: 'Sprint no encontrado' })
        return
      }
      const { name, startDate, endDate, status } = req.body as any
      if (name) sprint.name = name.trim()
      if (startDate) sprint.startDate = new Date(startDate)
      if (endDate) sprint.endDate = new Date(endDate)
      if (sprint.startDate > sprint.endDate) {
        res.status(400).json({ error: 'La fecha de inicio no puede ser mayor que la de fin' })
        return
      }
      if (status && ['planned', 'active', 'completed', 'cancelled'].includes(status)) {
        sprint.status = status
      }
      await sprint.save()
      res.json(sprint)
    } catch {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  static updateStories = async (req: Request, res: Response): Promise<void> => {
    try {
      // @ts-ignore
      if (req.project.manager.toString() !== req.user.id.toString()) {
        res.status(403).json({ error: 'Solo el manager puede modificar historias del sprint' })
        return
      }
      const { sprintId } = req.params
      const { stories } = req.body as { stories: string[] }
      if (!Array.isArray(stories)) {
        res.status(400).json({ error: 'Formato inválido de historias' })
        return
      }
      const sprint = await Sprint.findById(sprintId)
      if (!sprint || sprint.project.toString() !== req.project.id.toString()) {
        res.status(404).json({ error: 'Sprint no encontrado' })
        return
      }
      // Validar historias pertenecen al proyecto
      const count = await ProductBacklogItem.countDocuments({ _id: { $in: stories }, project: req.project.id })
      if (count !== stories.length) {
        res.status(400).json({ error: 'Algunas historias no pertenecen al proyecto' })
        return
      }
      sprint.stories = stories as any
      await sprint.save()
      res.json(sprint)
    } catch {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  static getStories = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sprintId } = req.params
      const sprint = await Sprint.findById(sprintId).populate('stories')
      if (!sprint || sprint.project.toString() !== req.project.id.toString()) {
        res.status(404).json({ error: 'Sprint no encontrado' })
        return
      }
      // @ts-ignore
      const stories = (sprint.stories || []).map((s: any) => ({
        _id: s._id,
        project: s.project,
        persona: s.persona,
        objetivo: s.objetivo,
        beneficio: s.beneficio,
        title: s.title,
        estimate: s.estimate,
        acceptanceCriteria: s.acceptanceCriteria,
        order: s.order,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
      res.json(stories)
    } catch {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  static remove = async (req: Request, res: Response): Promise<void> => {
    try {
      // @ts-ignore
      if (req.project.manager.toString() !== req.user.id.toString()) {
        res.status(403).json({ error: 'Solo el manager puede eliminar el sprint' })
        return
      }
      const { sprintId } = req.params
      const sprint = await Sprint.findById(sprintId)
      if (!sprint || sprint.project.toString() !== req.project.id.toString()) {
        res.status(404).json({ error: 'Sprint no encontrado' })
        return
      }
      await sprint.deleteOne()
      res.json({ message: 'Sprint eliminado' })
    } catch {
      res.status(500).json({ error: 'Hubo un error' })
    }
  }
}
