import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, MessageSquare, BarChart3, ChevronDown, ArrowRight, Github, Sparkles, Database, Linkedin, Users } from 'lucide-react'
import ParticleSphere from '../components/ParticleSphere'

const features = [
  { icon: Upload, title: 'Upload Your Data', desc: 'Drag & drop any CSV file. We auto-detect schema, columns, and data types instantly.', color: 'from-indigo-500 to-violet-600' },
  { icon: MessageSquare, title: 'Ask in Plain English', desc: 'No SQL, no code needed. Just type your question and get answers from your data.', color: 'from-cyan-500 to-blue-600' },
  { icon: BarChart3, title: 'Instant Visual Insights', desc: 'Beautiful charts, KPIs, and advanced analysis generated in seconds.', color: 'from-emerald-500 to-teal-600' }
]

const steps = [
  { n: '01', title: 'Upload CSV', desc: 'Drag your data file', emoji: '📁' },
  { n: '02', title: 'Ask a question', desc: 'Type in plain English', emoji: '💬' },
  { n: '03', title: 'Get dashboard', desc: 'Charts + KPIs + insights', emoji: '📊' }
]

const team = [
  { name: 'Sneha Shaw', role: 'Full Stack Developer', img: '/sneha.png', github: 'https://github.com/Sne-04', linkedin: 'https://www.linkedin.com/in/sneha-shaw23' },
  { name: 'Sukanya Bhattacharya', role: 'AI/ML Engineer', img: '/sukanya.png', github: '', linkedin: 'https://www.linkedin.com/in/sukanya-bhattacharya-4658022b3' }
]

const DonutSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="100" cy="100" r="70" fill="none" stroke="#1e1e2e" strokeWidth="30"/>
    <circle cx="100" cy="100" r="70" fill="none" stroke="#6366f1" strokeWidth="30"
      strokeDasharray="132 308" strokeDashoffset="0" transform="rotate(-90 100 100)"/>
    <circle cx="100" cy="100" r="70" fill="none" stroke="#22d3ee" strokeWidth="30"
      strokeDasharray="88 352" strokeDashoffset="-132" transform="rotate(-90 100 100)"/>
    <circle cx="100" cy="100" r="70" fill="none" stroke="#f59e0b" strokeWidth="30"
      strokeDasharray="66 374" strokeDashoffset="-220" transform="rotate(-90 100 100)"/>
    <circle cx="100" cy="100" r="40" fill="#0d0d14"/>
    <text x="100" y="95" textAnchor="middle" fill="#f1f5f9" fontSize="14" fontWeight="bold">42%</text>
    <text x="100" y="112" textAnchor="middle" fill="#94a3b8" fontSize="9">Electronics</text>
  </svg>
)

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0f]">

      {/* Navbar — fixed */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5" style={{ backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Database size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm">DataMind AI</span>
          </div>
          <button onClick={() => nav('/dashboard')} className="glow-btn rounded-lg px-5 py-2 text-xs font-semibold text-white flex items-center gap-1.5">
            Launch App <ArrowRight size={12} />
          </button>
        </div>
      </nav>

      {/* Hero — particle sphere contained here only */}
      <section className="relative w-full h-screen overflow-hidden">
        <ParticleSphere />
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-2xl mx-auto"
            style={{
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              padding: '2rem 2.5rem',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Intelligent Business Insights
            </motion.div>
            <h1 className="mb-4" style={{
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              fontWeight: 800,
              color: '#ffffff',
              textShadow: '0 0 40px rgba(99,102,241,0.9), 0 2px 20px rgba(0,0,0,0.8)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              DataMind AI
            </h1>
            <p className="mb-8" style={{
              color: '#e2e8f0',
              opacity: 1,
              fontSize: '1.2rem',
              textShadow: '0 2px 10px rgba(0,0,0,1)',
              fontWeight: 400
            }}>
              Ask your data anything.<br />
              <span className="font-medium">Get instant insights in seconds.</span>
            </p>
            <div className="flex gap-3 justify-center mb-6">
              <button onClick={() => nav('/dashboard')} className="glow-btn rounded-xl px-8 py-3.5 text-sm font-semibold flex items-center gap-2 text-white group">
                Launch Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="glass rounded-xl px-6 py-3.5 text-sm font-medium hover:border-white/20 transition-all glass-hover">
                Explore Features
              </button>
            </div>
            <p style={{ color: '#94a3b8', opacity: 1, fontSize: '0.85rem' }}>No SQL needed • Upload any CSV • Advanced Analysis</p>
          </motion.div>
        </div>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown size={24} className="text-primary/50" />
        </motion.div>
      </section>

      {/* Features — solid bg, no particles */}
      <section id="features" className="relative z-20 px-6 py-24 bg-[#0a0a0f]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">
              Everything you need for <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">data insights</span>
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">Transform raw CSV data into beautiful, actionable dashboards with natural language queries</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="glass rounded-2xl p-7 glass-hover transition-all duration-300 group cursor-default relative overflow-hidden">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — solid bg */}
      <section className="relative z-20 px-6 py-20 bg-[#0a0a0f]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">
              How it <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">works</span>
            </h2>
            <p className="text-sm text-slate-500">Three simple steps to data intelligence</p>
          </motion.div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="flex items-center">
                <div className="glass rounded-2xl p-6 text-center min-w-[180px] glass-hover transition-all group">
                  <div className="text-3xl mb-3">{s.emoji}</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-3 text-xs font-bold text-white group-hover:scale-110 transition-transform">
                    {s.n}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
                {i < 2 && (
                  <div className="mx-4 hidden md:flex items-center">
                    <div className="w-8 h-px bg-gradient-to-r from-primary/50 to-secondary/50" />
                    <ArrowRight size={14} className="text-primary/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Preview — SVG donut chart instead of spinner */}
      <section className="relative z-20 px-6 py-20 bg-[#0a0a0f]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="glass rounded-2xl p-1 shadow-2xl shadow-primary/10">
            <div className="glass rounded-xl p-6">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { v: '$1.24M', l: 'Revenue', t: '+12%', c: 'text-emerald-400' },
                  { v: '2,847', l: 'Users', t: '+28%', c: 'text-emerald-400' },
                  { v: '34.2%', l: 'Growth', t: '+5%', c: 'text-emerald-400' },
                  { v: '$436', l: 'Avg Order', t: '-3%', c: 'text-red-400' }
                ].map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }} className="glass rounded-lg p-3 text-center">
                    <p className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{m.v}</p>
                    <p className="text-[8px] text-slate-500 uppercase">{m.l}</p>
                    <p className={`text-[9px] font-semibold ${m.c}`}>{m.t}</p>
                  </motion.div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-lg p-4 h-28 flex items-end gap-1">
                  {[40,65,45,80,60,90,70].map((h, i) => (
                    <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.05 }} className="flex-1 bg-gradient-to-t from-primary to-secondary/50 rounded-t" />
                  ))}
                </div>
                <div className="glass rounded-lg p-4 h-28 flex items-center justify-center">
                  <DonutSVG />
                </div>
              </div>
            </div>
          </motion.div>
          <div className="text-center mt-8">
            <button onClick={() => nav('/dashboard')} className="glow-btn rounded-xl px-8 py-3.5 text-sm font-semibold inline-flex items-center gap-2 text-white group">
              Start Analyzing Your Data <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Team Section — solid bg */}
      <section className="relative z-20 px-6 py-20 bg-[#0a0a0f]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">
              Meet the <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Team</span>
            </h2>
            <p className="text-sm text-slate-500">Built with passion for GFG Hackfest 2026</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {team.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.2 }} className="glass rounded-2xl p-6 text-center glass-hover transition-all duration-300 group">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden ring-2 ring-primary/30 ring-offset-2 ring-offset-[#0a0a0f] group-hover:ring-primary/60 transition-all">
                  <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-base mb-0.5">{m.name}</h3>
                <p className="text-xs text-primary/80 font-medium mb-3">{m.role}</p>
                <div className="flex items-center justify-center gap-3">
                  {m.github && (
                    <a href={m.github} target="_blank" rel="noopener" className="text-slate-500 hover:text-white transition-colors p-1.5 glass rounded-lg">
                      <Github size={16} />
                    </a>
                  )}
                  {m.linkedin && (
                    <a href={m.linkedin} target="_blank" rel="noopener" className="text-slate-500 hover:text-blue-400 transition-colors p-1.5 glass rounded-lg">
                      <Linkedin size={16} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer — solid bg */}
      <footer className="relative z-20 border-t border-white/5 py-8 px-6 bg-[#0a0a0f]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Database size={12} className="text-white" />
            </div>
            <span className="font-bold text-sm">DataMind AI</span>
          </div>
          <p className="text-xs text-slate-500">Built for GFG Hackfest 2026</p>
          <a href="https://github.com/Sne-04/GFG-Hack-1" target="_blank" rel="noopener" className="text-slate-500 hover:text-white transition-colors">
            <Github size={18} />
          </a>
        </div>
      </footer>
    </div>
  )
}
