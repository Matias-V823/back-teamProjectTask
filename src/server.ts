import express from "express";
import { connectDB } from "./config/db";
import dotenv from 'dotenv'
import cors from 'cors'
import morgan from "morgan";
import { corsConfig } from "./config/cors";
import authRoutes from "./routes/authRoutes"
import projectRoutes from './routes/projectRoutes'

dotenv.config()
connectDB()

const app = express()


app.use(cors(corsConfig))
// Logging
app.use(morgan('dev'))

// Leer datos de formulario
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)



export default app