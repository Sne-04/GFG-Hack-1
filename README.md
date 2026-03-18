# DataMind AI 🚀
**Built for GFG Hackfest 2026**

DataMind AI is an ultra-premium, completely client-side AI analytics dashboard that lets you upload any raw CSV dataset and ask questions about it in **plain English**. Using advanced LLM contextualization, DataMind AI automatically parses columns, detects types, writes and executes SQL logic on the fly, and visualizes the answers entirely within your browser! No servers, no SQL knowledge, just pure data intelligence.

## ✨ Core Features
- **Ask in Plain English**: Powered by OpenAI, just type your query and get instant data intelligence.
- **Auto Data-Parsing**: Drop any CSV and the engine automatically infers headers, rows, and categorical limits.
- **Dynamic Chart Generation**: Automatically transforms query output into beautiful responsive Recharts (Bar, Line, Pie, Area).
- **Global Data Filters**: Context-aware dropdowns that securely isolate specific rows without rewriting queries.
- **Progressive Web App (PWA)**: Fully installable as a standalone app with offline service-worker caching capabilities!
- **Premium Dual-Theme Architecture**: Switch seamlessly between Apple-style *Indigo* and *Emerald* polished UI modes.

## 🛠 Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: Vanilla CSS + Tailwind CSS (Glassmorphism & Neon Glow UI)
- **State & Logic**: Custom React Hooks + Context API
- **AI Brain**: OpenAI `gpt-4o-mini` API Integration (Client-Side)
- **Visualization**: Recharts + Framer Motion
- **Icons**: Lucide React
- **PWA**: `vite-plugin-pwa`

## 🚀 Quickstart & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sne-04/GFG-Hack-1.git
   ```
2. **Navigate into the directory:**
   ```bash
   cd GFG-Hack-1
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Set Up the Environment:**
   Create a `.env` file in the root directory and add your OpenAI Key:
   ```env
   VITE_OPENAI_API_KEY=sk-your-openai-key-here
   ```
5. **Run the Development Server:**
   ```bash
   npm run dev
   ```

## 👥 Meet the Team
- **Sneha Shaw** - Full Stack Developer
- **Sukanya Bhattacharya** - AI/ML Engineer 
- **Gaurav Kumar Mehta** - Full Stack MERN Developer
