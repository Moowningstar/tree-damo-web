const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const chatService = {
  async chat(message, sessionId, onChunk) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        use_rag: true,
      }),
    })

    if (!response.ok) {
      throw new Error('Chat request failed')
    }

    const newSessionId = response.headers.get('X-Session-ID')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      onChunk(chunk, newSessionId)
    }
  },

  async rebuildIndex() {
    const response = await fetch(`${API_BASE_URL}/rebuild-index`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Rebuild index failed')
    }

    return response.json()
  },
}
