# 🧠 DataMind AI — Conversational BI Dashboard

> Ask your data anything. Get instant insights in seconds.

A full-stack AI-powered Business Intelligence dashboard that lets anyone — no SQL needed — generate interactive dashboards using natural language queries, powered by **Claude AI**.

## ✨ Features

- 🎯 **Natural Language Queries** — Ask questions in plain English
- 📊 **Auto-Generated Charts** — Line, bar, area, pie, composed charts
- 📈 **KPI Cards** — Key metrics with animated counters & trend indicators
- 🤖 **AI Chat** — Follow-up questions about your data
- 🌐 **Three.js Landing** — 8000-particle morphing sphere
- 🎨 **3 Themes** — Purple, Cyan, Green
- 📤 **Export PNG** — One-click dashboard export
- 📁 **CSV Upload** — Drag & drop any CSV file

## 🚀 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Animations | Framer Motion |
| 3D Graphics | Three.js |
| CSV Parsing | PapaParse |
| Icons | Lucide React |
| Export | html2canvas |
| AI | Claude AI (claude-sonnet-4-20250514) |

## 📦 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 🔑 Setup

1. Get a Claude API key from [Anthropic Console](https://console.anthropic.com)
2. In the dashboard, click **API Settings** in the sidebar
3. Paste your API key

## 🌐 Deploy to Vercel

```bash
npm run build
npx vercel --prod
```

## 📁 Project Structure

```
src/
  pages/
    LandingPage.jsx     ← Three.js hero + features
    Dashboard.jsx       ← 3-panel BI dashboard
  components/
    ParticleSphere.jsx  ← Three.js 8000-particle morph
    ParticleBackground.jsx
    KPICard.jsx, ChartCard.jsx, DynamicChart.jsx
    AIChat.jsx, QueryInput.jsx, CSVUpload.jsx
    LoadingSteps.jsx, InsightBanner.jsx, FilterBar.jsx
  utils/
    claudeApi.js        ← Claude AI integration
    csvParser.js        ← PapaParse wrapper
    chartHelpers.js
```

## 👥 Team

Built for GFG Hackathon by **Sneha Shaw** & **Gaurav Kumar Mehta**

---

*Powered by Claude AI • Built with ❤️*
