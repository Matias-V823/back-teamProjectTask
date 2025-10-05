import { Request, Response } from 'express'
import ProductBacklogItem from '../models/ProductBacklog'
import Project from '../models/Project'

function buildTitle(persona: string, objetivo: string, beneficio: string) {
    return `Como ${persona}, yo quiero ${objetivo} de modo que ${beneficio}`
}

export class ProductBacklogController {

    static list = async (req: Request, res: Response): Promise<void> => {
        try {
            const items = await ProductBacklogItem
                .find({ project: (req as any).project.id })
                .sort({ order: 1 })
            res.json(items)
        } catch {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static create = async (req: Request, res: Response): Promise<void> => {
        try {
            // Doble validación (defensa en profundidad)
            // @ts-ignore
            if (req.project.manager.toString() !== req.user.id.toString()) {
                res.status(403).json({ error: 'Solo el manager puede modificar el Product Backlog' })
                return
            }
            const projectId = (req as any).project.id
            const count = await ProductBacklogItem.countDocuments({ project: projectId })
            const { persona, objetivo, beneficio, estimate = 0, acceptanceCriteria = '' } = req.body

            const item = new ProductBacklogItem({
                project: projectId,
                persona: persona.trim(),
                objetivo: objetivo.trim(),
                beneficio: beneficio.trim(),
                title: buildTitle(persona.trim(), objetivo.trim(), beneficio.trim()),
                estimate,
                acceptanceCriteria,
                order: count + 1
            })

            await item.save()
            await Project.findByIdAndUpdate(projectId, { $push: { productBacklog: item._id } })
            res.status(201).json(item)
        } catch (e: any) {
            res.status(500).json({ error: e.message || 'Hubo un error' })
        }
    }

    static getOne = async (req: Request, res: Response): Promise<void> => {
        try {
            const { storyId } = req.params
            const projectId = (req as any).project.id
            const item = await ProductBacklogItem.findById(storyId)
            if (!item || item.project.toString() !== projectId.toString()) {
                res.status(404).json({ error: 'Historia no encontrada' })
                return
            }
            res.json(item)
        } catch {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static update = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            if (req.project.manager.toString() !== req.user.id.toString()) {
                res.status(403).json({ error: 'Solo el manager puede modificar el Product Backlog' })
                return
            }
            const { storyId } = req.params
            const projectId = (req as any).project.id
            const item = await ProductBacklogItem.findById(storyId)
            if (!item || item.project.toString() !== projectId.toString()) {
                res.status(404).json({ error: 'Historia no encontrada' })
                return
            }
            const { persona, objetivo, beneficio, estimate, acceptanceCriteria } = req.body
            item.persona = persona.trim()
            item.objetivo = objetivo.trim()
            item.beneficio = beneficio.trim()
            if (estimate !== undefined) item.estimate = estimate
            if (acceptanceCriteria !== undefined) item.acceptanceCriteria = acceptanceCriteria
            item.title = buildTitle(item.persona, item.objetivo, item.beneficio)
            await item.save()
            res.json(item)
        } catch {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static remove = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            if (req.project.manager.toString() !== req.user.id.toString()) {
                res.status(403).json({ error: 'Solo el manager puede modificar el Product Backlog' })
                return
            }
            const { storyId } = req.params
            const projectId = (req as any).project.id
            const item = await ProductBacklogItem.findById(storyId)
            if (!item || item.project.toString() !== projectId.toString()) {
                res.status(404).json({ error: 'Historia no encontrada' })
                return
            }
            await item.deleteOne()
            await Project.findByIdAndUpdate(projectId, { $pull: { productBacklog: item._id } })

            // Reindexar órdenes
            const items = await ProductBacklogItem.find({ project: projectId }).sort({ order: 1 })
            for (let i = 0; i < items.length; i++) {
                if (items[i].order !== i + 1) {
                    items[i].order = i + 1
                    await items[i].save()
                }
            }

            res.json({ message: 'Historia eliminada' })
        } catch {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static reorder = async (req: Request, res: Response): Promise<void> => {
        try {
            // @ts-ignore
            if (req.project.manager.toString() !== req.user.id.toString()) {
                res.status(403).json({ error: 'Solo el manager puede modificar el Product Backlog' })
                return
            }
            const projectId = (req as any).project.id
            const { order } = req.body as { order: string[] }

            if (!Array.isArray(order) || order.length === 0) {
                res.status(400).json({ error: 'Orden inválido' })
                return
            }

            const items = await ProductBacklogItem.find({ _id: { $in: order }, project: projectId })
            if (items.length !== order.length) {
                res.status(400).json({ error: 'Algunas historias no pertenecen al proyecto' })
                return
            }

            await Promise.all(
                order.map((id, idx) =>
                    ProductBacklogItem.updateOne({ _id: id }, { $set: { order: idx + 1 } })
                )
            )

            const updated = await ProductBacklogItem.find({ project: projectId }).sort({ order: 1 })
            res.json(updated)
        } catch {
            res.status(500).json({ error: 'Hubo un error' })
        }
    }
}