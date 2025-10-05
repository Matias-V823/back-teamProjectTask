import type { Request, Response, NextFunction } from "express";
import ProductBacklogItem from "../models/ProductBacklog";

export async function backlogItemExists(req: Request, res: Response, next: NextFunction) {
    try {
        const { storyId } = req.params;
        const item = await ProductBacklogItem.findById(storyId);
        if (!item) {
            return res.status(404).json({ error: 'Historia no encontrada' });
        }
        // @ts-ignore
        req.backlogItem = item;
        next();
    } catch {
        res.status(500).json({ error: 'Hubo un error' });
    }
}

export async function backlogItemBelongsToProject(req: Request, res: Response, next: NextFunction) {
    // @ts-ignore
    if (req.backlogItem.project.toString() !== req.project.id.toString()) {
        return res.status(400).json({ error: 'La historia no pertenece a este proyecto' });
    }
    next();
}