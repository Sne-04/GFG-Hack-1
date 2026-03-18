const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''

function buildSystemPrompt(schema, sampleData, rowCount) {
  return `You are DataMind AI, an expert business intelligence analyst.

CSV Schema: ${schema}
Sample rows (first 3): ${sampleData}
Total rows: ${rowCount}

CRITICAL: Respond ONLY with raw valid JSON.
No markdown. No backticks. No explanation. Just JSON.

Required JSON structure:
{
  "understood_intent": "brief description",
  "cannot_answer": false,
  "cannot_answer_reason": null,
  "sql_logic": "WITH monthly_stats AS (\n  SELECT month, SUM(revenue) as total_rev\n  FROM data\n  GROUP BY month\n)\nSELECT month, total_rev,\n       LAG(total_rev) OVER(ORDER BY month) as prev_month\nFROM monthly_stats;",
  "anomalies": ["Feb revenue 23% below average trend"],
  "trend_analysis": "The data indicates a consistent upward growth trajectory of +89% from January through December. We observed a significant peak during Q4, largely driven by holiday sales in the Enterprise segment. However, February experienced a notable 23% dip below the baseline average, suggesting a potential seasonal slowdown or inventory shortage during that period. Overall, the foundational metrics remain highly positive.",
  "kpis": [
    {
      "label": "Total Revenue",
      "value": 612000,
      "unit": "$",
      "trend": "+12.4%",
      "trend_direction": "up"
    }
  ],
  "charts": [
    {
      "id": "chart1",
      "type": "line",
      "title": "Monthly Revenue Trend",
      "subtitle": "Jan - Dec 2024",
      "reason": "Line chart chosen because data is time-series",
      "xKey": "month",
      "yKeys": [
        {"key": "revenue", "name": "Revenue", "color": "#6366f1"}
      ],
      "data": [
        {"month": "Jan", "revenue": 38000}
      ]
    }
  ],
  "ai_insight": "Revenue peaked in December at $72K with +89% full-year growth. February showed a seasonal 23% dip. North region led with 38% of total contribution."
}

ABSOLUTE RULES:
1. NEVER hallucinate — only use data actually in the CSV.
2. YOU MUST NEVER set "cannot_answer" to true unless the CSV has 0 rows. 
3. If the user asks for data (like sales or region) that is NOT in the CSV, DO NOT REFUSE. Instead, IGNORE their specific request and generate a generic, useful dashboard based ONLY on the columns that DO exist in the CSV.
4. Explain any missing data or reinterpretation clearly in "trend_analysis" and "ai_insight".
5. STILL set "cannot_answer" to false in this case.
6. Return EXACTLY 3-4 charts every time.
7. Return EXACTLY 4 KPI cards every time.
8. Chart selection rules:
   line     → time series, trends over months/days/years
   bar      → comparing categories (regions, products)
   area     → volume/cumulative over time
   pie      → parts of whole, max 6 segments only
   donut    → same as pie, modern style
   composed → showing 2 different metrics together
9. Aggregate CSV data yourself, return chart-ready arrays.
10. Max 20 data points per chart.
11. KPI value must be a number only, no symbols.
12. Always find and report anomalies in the data.
11. Use these colors in yKeys: "#6366f1", "#22d3ee", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"`
}

function parseAIResponse(text) {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    const startIdx = cleaned.indexOf('{')
    const endIdx = cleaned.lastIndexOf('}')
    if (startIdx === -1 || endIdx === -1) throw new Error('No JSON found')
    const jsonStr = cleaned.slice(startIdx, endIdx + 1)
    return JSON.parse(jsonStr)
  } catch (e) {
    return { cannot_answer: true, cannot_answer_reason: 'Failed to parse AI response. Please try again.' }
  }
}

export async function queryOpenAI(query, schema, sampleData, rowCount, conversationHistory = [], apiKey) {
  const key = apiKey || OPENAI_API_KEY
  if (!key) throw new Error('No API key configured')

  const systemPrompt = buildSystemPrompt(
    typeof schema === 'string' ? schema : JSON.stringify(schema),
    typeof sampleData === 'string' ? sampleData : JSON.stringify(sampleData),
    rowCount
  )

  const response = await fetch('/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: query }
      ]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content || ''
  return parseAIResponse(text)
}

export async function chatWithOpenAI(message, context, history = [], apiKey) {
  const key = apiKey || OPENAI_API_KEY
  if (!key) throw new Error('No API key configured')

  const chatSystemPrompt = `
You are DataMind AI assistant.
The user is viewing a dashboard about their CSV data.
Context regarding schema and dashboard data: ${context}

Answer the user's question about this data concisely.
Give direct insights, numbers, and recommendations.
Keep response under 100 words.
`

  try {
    const response = await fetch('/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: chatSystemPrompt },
          ...history,
          { role: 'user', content: message }
        ]
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('Chat API Error:', err)
      throw new Error(err.error?.message || 'Chat API error')
    }
    
    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'
  } catch (error) {
    console.error('Error in chatWithOpenAI:', error)
    throw error // Bubble up to UI
  }
}

