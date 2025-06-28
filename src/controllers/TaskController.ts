import type { Request, Response } from "express";
import colors from 'colors'
import Task from "../models/Task";



export class TaskController {
    static createTask = async (req: Request, res: Response): Promise<any> => {
        try {
            const task = new Task(req.body)
            task.project = req.project.id
            req.project.tasks.push(task.id)
            await Promise.allSettled([task.save(), req.project.save()])  // nos permite guardar los project y task al mismo tiempo
            res.send('Tarea creada correctamente')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static getTasks = async (req: Request, res: Response): Promise<any> => {
        try {
            const tasks = await Task.find({project: req.project.id}).populate('project')//se le coloca el nombre del scheema no del modelo
            res.json(tasks)
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }
    static getTasksById = async (req: Request, res: Response): Promise<any> => {
        try {
            res.json(req.task)
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }
    static updateTask = async (req: Request, res: Response): Promise<any> => {
        try {
            req.task.name = req.body.name
            req.task.description = req.body.description
            await req.task.save()
            res.send("Tarea actualizada correctamente")
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }
    static deleteTask = async (req: Request, res: Response): Promise<any> => {
        try {
            req.project.tasks = req.project.tasks.filter(task => task.toString() !== req.task._id.toString())
            await Promise.allSettled([req.task.deleteOne(), req.project.save()])
            res.send("Tarea eliminada correctamente")
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }
    static updateStatusTask = async (req: Request, res: Response): Promise<any> => {
        try {
            req.task.status = req.body.status
            await req.task.save()
            res.send("Estado de tarea actualizado")
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }
}