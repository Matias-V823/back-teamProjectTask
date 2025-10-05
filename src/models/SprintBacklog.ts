import mongoose, { Schema, Document, Types } from 'mongoose'

export const sprintStatus = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export type SprintStatus = typeof sprintStatus[keyof typeof sprintStatus]

export interface ISprint extends Document {
  project: Types.ObjectId
  name: string
  startDate: Date
  endDate: Date
  stories: Types.ObjectId[]
  status: SprintStatus
  createdAt: Date
  updatedAt: Date
}

const SprintSchema = new Schema<ISprint>({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'projects',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  stories: [
    {
      type: Schema.Types.ObjectId,
      ref: 'product_backlog_item'
    }
  ],
  status: {
    type: String,
    enum: Object.values(sprintStatus),
    default: sprintStatus.PLANNED
  }
}, { timestamps: true })

SprintSchema.index({ project: 1, name: 1 }, { unique: true })

const Sprint = mongoose.model<ISprint>('sprint_backlog', SprintSchema)
export default Sprint