export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'Server API key not configured' } })
  }

  try {
    const { model, max_tokens, messages, response_format } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: 'Invalid request: messages required' } })
    }

    const body = {
      model: model || 'gpt-4o',
      max_tokens: Math.min(max_tokens || 4096, 4096),
      messages
    }

    if (response_format) {
      body.response_format = response_format
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: { message: 'Internal server error' } })
  }
}
