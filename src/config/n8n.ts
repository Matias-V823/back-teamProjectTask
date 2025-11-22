export const N8N_CONFIG = {
  WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/scrum-agents',
  HEADERS: {
    'Content-Type': 'application/json',
  },
  TIMEOUT: 220000, 
}

export const sendToN8nWebhook = async (data: any) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), N8N_CONFIG.TIMEOUT)

  try {
    const response = await fetch(N8N_CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers: N8N_CONFIG.HEADERS,
      body: JSON.stringify(data),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const responseText = await response.text()
    
    // Si la respuesta está vacía, retorna un objeto por defecto
    if (!responseText || responseText.trim() === '') {
      return { status: 'ok', message: 'Workflow completed successfully' }
    }

    try {
      return JSON.parse(responseText)
    } catch (parseError) {
      console.warn('Invalid JSON response from n8n, returning raw response')
      return { status: 'ok', message: responseText }
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}
