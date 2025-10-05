import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProductBacklogItem extends Document {
    project: string
    persona: string
    objetivo: string
    beneficio: string
    title: string
    estimate: number
    acceptanceCriteria: string   
    order: number
    createdAt: Date
    updatedAt: Date
}

const ProductBacklogItemSchema = new Schema<IProductBacklogItem>({
    project: {
        type: String,
        ref: 'projects',
        required: true,
        index: true
    },
    persona: {
        type: String,
        required: true,
        trim: true
    },
    objetivo: {
        type: String,
        required: true,
        trim: true
    },
    beneficio: {
        type: String,
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    estimate: {
        type: Number,
        default: 0
    },
    acceptanceCriteria: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        required: true
    }
}, { timestamps: true })

ProductBacklogItemSchema.index({ project: 1, order: 1 }, { unique: true })

const ProductBacklogItem = mongoose.model<IProductBacklogItem>('product_backlog_item', ProductBacklogItemSchema)
export default ProductBacklogItem