import { Request, Response } from 'express'
import { sendToN8nWebhook } from '../config/n8n'

export class AIController {
  static async generateProjectPlan(req: Request, res: Response): Promise<void> {
    try {
      const aiProjectData = req.body

      if (!aiProjectData) {
        res.status(400).json({
          success: false,
          error: 'No project data provided'
        })
        return
      }

      const requiredFields = ['projectInfo', 'teamMembers', 'projectRequirements', 'sprintConfiguration']
      const missingFields = requiredFields.filter(field => !aiProjectData[field])

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        })
        return
      }

      console.log('Enviando datos a n8n - Usuario:', (req as any).user?.id)

      const result = await sendToN8nWebhook(aiProjectData)

      let responseData = result

      if (Array.isArray(responseData)) {
        responseData = responseData[0] || {}
      }

      if (responseData.agentes) {
        responseData = { agentes: responseData.agentes }
      } else if (responseData.backlog) {
        responseData = {
          agentes: [{
            agente: 'Agente',
            backlog: responseData.backlog
          }]
        }
      }

      res.status(200).json({
        status: "ok",
        message: "Planning generated successfully",
        data: responseData,
        timestamp: new Date().toISOString()
      })
    } catch (error: any) {
      console.error('Error al comunicarse con n8n:', error.message)
      console.error('Error stack:', error.stack)

      let statusCode = 500
      let errorMessage = error.message || 'Error al generar planificación con IA'

      if (error.message?.includes('HTTP error')) {
        statusCode = 502
        errorMessage = 'N8N service unavailable'
      } else if (error.message?.includes('AbortError')) {
        statusCode = 504
        errorMessage = 'Request timeout'
      }      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      })
    }
  }
}
