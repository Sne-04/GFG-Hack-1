/**
 * Multi-LLM Fallback Chain
 * 
 * Tries providers in order: Anthropic (primary) → OpenAI (fallback 1) → Groq (fallback 2)
 * If one fails, automatically tries the next. Logs which provider succeeded.
 * 
 * All providers are normalized to return the same OpenAI-compatible response shape.
 */

const TIMEOUT_MS = 30_000

// ─── Provider Configurations ─────────────────────────────────────

const PROVIDERS = [
  {
    name: 'anthropic',
    keyEnv: 'ANTHROPIC_API_KEY',
    modelEnv: 'MODEL_PRIMARY',
    defaultModel: 'claude-haiku-4-5',
    endpoint: 'https://api.anthropic.com/v1/messages',
    buildRequest: (apiKey, model, messages, maxTokens, responseFormat) => {
      // Convert OpenAI-style messages to Anthropic format
      const systemMsg = messages.find(m => m.role === 'system')
      const nonSystemMsgs = messages.filter(m => m.role !== 'system')

      const body = {
        model,
        max_tokens: maxTokens,
        messages: nonSystemMsgs.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }

      if (systemMsg) {
        body.system = systemMsg.content
      }

      return {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      }
    },
    parseResponse: (data) => {
      // Normalize Anthropic response to OpenAI shape
      const content = data.content?.[0]?.text || ''
      return {
        choices: [{ message: { role: 'assistant', content } }],
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        _provider: 'anthropic',
        _model: data.model,
      }
    },
  },
  {
    name: 'openai',
    keyEnv: 'OPENAI_API_KEY',
    modelEnv: 'MODEL_FALLBACK',
    defaultModel: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    buildRequest: (apiKey, model, messages, maxTokens, responseFormat) => {
      const body = { model, max_tokens: maxTokens, messages }
      if (responseFormat) body.response_format = responseFormat
      return {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      }
    },
    parseResponse: (data) => ({
      ...data,
      _provider: 'openai',
      _model: data.model,
    }),
  },
  {
    name: 'groq',
    keyEnv: 'GROQ_API_KEY',
    modelEnv: 'MODEL_FAST',
    defaultModel: 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    buildRequest: (apiKey, model, messages, maxTokens, responseFormat) => {
      const body = { model, max_tokens: maxTokens, messages }
      if (responseFormat) body.response_format = responseFormat
      return {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      }
    },
    parseResponse: (data) => ({
      ...data,
      _provider: 'groq',
      _model: data.model,
    }),
  },
]

/**
 * Call a single LLM provider with timeout.
 * @returns {Promise<object>} Normalized response
 * @throws on failure
 */
async function callProvider(provider, messages, maxTokens, responseFormat) {
  const apiKey = process.env[provider.keyEnv]
  if (!apiKey) {
    throw new Error(`${provider.name}: API key not configured (${provider.keyEnv})`)
  }

  const model = process.env[provider.modelEnv] || provider.defaultModel
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const reqOpts = provider.buildRequest(apiKey, model, messages, maxTokens, responseFormat)
    reqOpts.signal = controller.signal

    const response = await fetch(provider.endpoint, reqOpts)
    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      const errMsg = data?.error?.message || data?.error?.type || `HTTP ${response.status}`
      throw new Error(`${provider.name} API error: ${errMsg}`)
    }

    return provider.parseResponse(data)
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new Error(`${provider.name}: Request timed out after ${TIMEOUT_MS / 1000}s`)
    }
    throw error
  }
}

/**
 * Multi-LLM fallback chain.
 * Tries each provider in sequence. Returns the first successful response.
 * 
 * @param {object} opts
 * @param {Array} opts.messages - OpenAI-format messages array
 * @param {number} opts.maxTokens - Max tokens (default 4096)
 * @param {object} opts.responseFormat - Optional response format (e.g., { type: "json_object" })
 * @returns {Promise<object>} - Normalized response with _provider and _model fields
 */
export async function callLLM({ messages, maxTokens = 4096, responseFormat = null }) {
  const errors = []

  for (const provider of PROVIDERS) {
    // Skip providers without API keys configured
    if (!process.env[provider.keyEnv]) {
      console.log(`[llm] Skipping ${provider.name}: no API key`)
      continue
    }

    try {
      console.log(`[llm] Trying ${provider.name} (${process.env[provider.modelEnv] || provider.defaultModel})...`)
      const result = await callProvider(provider, messages, maxTokens, responseFormat)
      console.log(`[llm] ✅ ${provider.name} succeeded — tokens: ${result.usage?.total_tokens || '?'}`)
      return result
    } catch (error) {
      console.error(`[llm] ❌ ${provider.name} failed: ${error.message}`)
      errors.push({ provider: provider.name, error: error.message })
    }
  }

  // All providers failed
  const errorSummary = errors.map(e => `${e.provider}: ${e.error}`).join('; ')
  throw new Error(`All LLM providers failed: ${errorSummary}`)
}

/**
 * Get list of available (configured) providers.
 * @returns {string[]}
 */
export function getAvailableProviders() {
  return PROVIDERS
    .filter(p => !!process.env[p.keyEnv])
    .map(p => p.name)
}
