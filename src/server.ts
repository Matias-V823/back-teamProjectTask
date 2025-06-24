import express from "express";
import { connectDB } from "./config/db";
import dotenv from 'dotenv'

dotenv.config()


connectDB()
const app = express()

export default app