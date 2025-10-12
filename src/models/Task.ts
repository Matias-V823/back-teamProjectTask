import mongoose, { Schema, Document, Types } from "mongoose";


const taskStatus = {
    PENDING: 'pending',
    ON_HOLD: 'onHold',
    IN_PROGRESS: 'inProgress',
    UNDER_REVIEW: 'underReview',
    COMPLETED: 'completed'
} as const 

export type TaskStatus = typeof taskStatus[keyof typeof taskStatus]


export interface ITask extends Document {
    name: string
    description: string
    project: Types.ObjectId
    sprint?: Types.ObjectId | null
    story?: Types.ObjectId | null
    status: TaskStatus
    assignedTo?: Types.ObjectId | null
    createdAt: Date
    updatedAt: Date
}

export const TaskSchema: Schema = new Schema({
    name: {
        type: String,
        trim: true,
        require: true
    },
    description: {
        type: String,
        trim: true,
        require: true
    },
    project: {
        type: Types.ObjectId,
        ref: 'projects'
    },
    sprint: {
        type: Types.ObjectId,
        ref: 'sprint',
        default: null,
        index: true
    },
    story: {
        type: Types.ObjectId,
        ref: 'product_backlog_item',
        default: null,
        index: true
    },
    status:{
        type: String,
        enum: Object.values(taskStatus),
        default: taskStatus.PENDING
    },
    assignedTo: {
        type: Types.ObjectId,
        ref: 'user',
        default: null,
        index: true
    }
}, { timestamps: true })

const Task = mongoose.model<ITask>('task', TaskSchema)
export default Task
