// Rate limiter: prevents API calls within cooldown period
let lastCallTime = 0
const RATE_LIMIT_MS = 2000

function checkRateLimit() {
  const now = Date.now()
  if (now - lastCallTime < RATE_LIMIT_MS) {
    throw new Error('Please wait a moment before sending another request.')
  }
  lastCallTime = now
}

function buildSystemPrompt(schema, sampleData, rowCount) {
  return `You are DataMind AI, a world-class business intelligence analyst.
You have been given a CSV dataset to analyze. Your job is to read the data precisely, compute correct aggregates, and return a structured JSON dashboard.

CSV COLUMN SCHEMA:
${schema}

ACTUAL CSV DATA (up to 50 rows):
${sampleData}

TOTAL ROW COUNT: ${rowCount}

CRITICAL: Respond ONLY with raw valid JSON. No markdown. No backticks. No explanation text outside the JSON.

Required JSON structure:
{
  "understood_intent": "brief description of the user's question",
  "cannot_answer": false,
  "cannot_answer_reason": null,
  "sql_logic": "The SQL query you would use to answer this question",
  "anomalies": ["list of data anomalies you found"],
  "trend_analysis": "detailed 3-4 sentence analysis of the data trends",
  "kpis": [
    {
      "label": "Metric Name",
      "value": 12345,
      "unit": "$",
      "trend": "+12.4%",
      "trend_direction": "up"
    }
  ],
  "charts": [
    {
      "id": "chart1",
      "type": "bar",
      "title": "Chart Title",
      "subtitle": "Chart Subtitle",
      "reason": "Why this chart type was chosen",
      "xKey": "column_name",
      "yKeys": [
        {"key": "value_col", "name": "Display Name", "color": "#6366f1"}
      ],
      "data": [
        {"column_name": "Label", "value_col": 100}
      ]
    }
  ],
  "ai_insight": "A concise 2-sentence insight about the data"
}

ABSOLUTE RULES:
1. ACCURACY IS PARAMOUNT — read every value from the actual CSV data provided above. Count rows, sum numbers, compute averages ONLY from the real data. NEVER invent or hallucinate numbers.
2. If the user's question relates to columns or values that DO NOT exist in the CSV, DO NOT REFUSE. Instead, generate a useful overview dashboard using the columns that DO exist and explain in "ai_insight" that you used available columns.
3. Set "cannot_answer" to true ONLY if:
   - The question is completely unrelated to any kind of data analysis (e.g., "who is X?", "write me a poem", "what is the capital of France?").
   - In this case, set "cannot_answer_reason" to: "I am DataMind AI, a specialized data analyst. I can only help with questions about your uploaded dataset."
4. Return EXACTLY 3-4 charts every time (when answering about data).
5. Return EXACTLY 4 KPI cards every time (when answering about data).
6. Chart type selection:
   line     → time series, trends over months/days/years
   bar      → comparing categories (regions, products, names)
   area     → volume/cumulative over time
   pie      → parts of whole, max 6 segments only
   donut    → same as pie, modern style
   composed → showing 2 different metrics together
   heatmap  → comparing values across two dimensions (e.g., region vs month). For 1D heatmap use standard xKey + single yKey. For 2D heatmap use xKey for rows, first yKey as the value, second yKey as the column category.
   scatter  → correlation between two numeric variables
7. Aggregate the actual CSV data yourself and return chart-ready data arrays.
8. Max 20 data points per chart.
9. KPI "value" must be a raw number only, no currency symbols or formatting.
10. Always find and report anomalies (outliers, missing data, unexpected patterns).
11. Use these colors in yKeys: "#6366f1", "#22d3ee", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"
12. Double-check all sums, averages, and counts against the actual CSV data before responding.`
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

async function callAPI(body) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error: ${response.status}`)
  }

  return response.json()
}

export async function queryOpenAI(query, schema, sampleData, rowCount, conversationHistory = []) {
  checkRateLimit()

  const systemPrompt = buildSystemPrompt(
    typeof schema === 'string' ? schema : JSON.stringify(schema),
    typeof sampleData === 'string' ? sampleData : JSON.stringify(sampleData),
    rowCount
  )

  const data = await callAPI({
    model: 'gpt-4o',
    max_tokens: 4096,
    response_format: { type: "json_object" },
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: query }
    ]
  })

  const text = data.choices?.[0]?.message?.content || ''
  return parseAIResponse(text)
}

export async function chatWithOpenAI(message, context, history = []) {
  checkRateLimit()

  const chatSystemPrompt = `You are DataMind AI, a strict internal data analyst assistant.

DASHBOARD CONTEXT (schema, KPIs, charts, insights from the user's CSV data):
${context}

ABSOLUTE RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
1. You may ONLY answer questions that directly relate to the user's uploaded CSV data, their dashboard metrics, KPIs, charts, trends, columns, or data analysis.
2. If the user asks ANYTHING that is NOT about their dataset — such as general knowledge ("who is X?"), trivia ("capital of Y?"), creative writing ("write a poem"), coding questions, personal questions, or ANY topic unrelated to data analytics — you MUST reply EXACTLY with:
   "🔒 I'm DataMind AI, your dedicated data analyst. I can only answer questions about your uploaded dataset and dashboard metrics. Please ask me something about your data!"
3. DO NOT attempt to be helpful on off-topic questions. DO NOT give partial answers. Just refuse politely with the message above.
4. When answering data questions: provide specific numbers, percentages, and actionable recommendations directly from the context.
5. Keep responses under 120 words.
6. Use bullet points for clarity when listing multiple insights.
7. Always reference actual column names and values from the dataset.`

  try {
    const data = await callAPI({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: chatSystemPrompt },
        ...history,
        { role: 'user', content: message }
      ]
    })
    return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'
  } catch (error) {
    console.error('Error in chatWithOpenAI:', error)
    throw error
  }
}
