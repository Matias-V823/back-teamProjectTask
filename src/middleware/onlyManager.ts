import { Request, Response, NextFunction } from 'express'

export function onlyManager(req: Request, res: Response, next: NextFunction): void {
    const project: any = (req as any).project
    const user: any = (req as any).user

    if (!project || !user) {
        res.status(400).json({ error: 'Contexto de proyecto o usuario no disponible' })
        return
    }
    if (project.manager.toString() !== user.id.toString()) {
        res.status(403).json({ error: 'Solo el manager puede modificar el Product Backlog' })
        return
    }
    next()
}