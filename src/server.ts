import express from "express";
import { connectDB } from "./config/db";
import dotenv from 'dotenv'
import cors from 'cors'
import morgan from "morgan";
import { corsConfig } from "./config/cors";
import authRoutes from "./routes/authRoutes"
import projectRoutes from './routes/projectRoutes'
import profileRoutes from './routes/profileRoutes'
import aiRoutes from './routes/aiRoutes'

dotenv.config()
connectDB()

const app = express()


app.use(cors(corsConfig))
app.use(morgan('dev'))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/ai', aiRoutes)



export default app