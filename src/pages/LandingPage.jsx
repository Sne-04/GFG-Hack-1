import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, MessageSquare, BarChart3, ArrowRight, Github, Sparkles, Database, Linkedin, Twitter, Globe, Zap, Shield, Clock, ChevronDown } from 'lucide-react'
import ParticleSphere from '../components/ParticleSphere'

const features = [
  { icon: Upload, title: 'Upload Your Data', desc: 'Drag & drop any CSV or Excel file. We auto-detect schema, columns, and data types instantly.', color: 'bg-indigo-500' },
  { icon: MessageSquare, title: 'Ask in Plain English', desc: 'No SQL knowledge needed. Just type your question and get answers powered by AI.', color: 'bg-cyan-500' },
  { icon: BarChart3, title: 'Instant Visual Insights', desc: 'Beautiful charts, KPIs, trend analysis and anomaly detection generated in seconds.', color: 'bg-emerald-500' }
]

const stats = [
  { value: '10K+', label: 'Datasets Analyzed' },
  { value: '<3s', label: 'Average Response' },
  { value: '99.9%', label: 'Uptime' },
  { value: '50+', label: 'Chart Types' },
]

const team = [
  { name: 'Sneha Shaw', role: 'Full Stack Developer', img: '/sneha.png', github: 'https://github.com/Sne-04', linkedin: 'https://www.linkedin.com/in/sneha-shaw23' },
  { name: 'Sukanya Bhattacharya', role: 'AI/ML Engineer', img: '/sukanya.png', github: '', linkedin: 'https://www.linkedin.com/in/sukanya-bhattacharya-4658022b3' },
  { name: 'Gaurav Kumar Mehta', role: 'Full Stack MERN Developer', img: 'https://github.com/gaurav620.png', github: 'https://github.com/gaurav620', linkedin: 'https://www.linkedin.com/in/gaurav-kumar-mehta-6718571a6', website: 'https://www.gauravkumarmehta.com', twitter: 'https://twitter.com/GAURAV___06' }
]

export default function LandingPage() {
  const nav = useNavigate()

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
              <Database size={15} className="text-white" />
            </div>
            <span className="font-bold text-[15px] text-white tracking-tight">DataMind AI</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">How it Works</a>
            <a href="#team" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Team</a>
            <button onClick={() => nav('/dashboard')} className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-500/25">
              Launch App <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero with 3D Particle Sphere ─── */}
      <section className="relative w-full h-screen overflow-hidden" style={{ background: '#0a0a0f' }}>
        <ParticleSphere />
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-4xl mx-auto">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">AI-Powered Data Intelligence</span>
            </motion.div>
            <h1 className="mb-5" style={{
              fontSize: 'clamp(3rem, 8vw, 5.5rem)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              DataMind AI
            </h1>
            <p className="mb-8" style={{
              color: '#94a3b8',
              fontSize: '1.15rem',
              fontWeight: 400
            }}>
              Ask your data anything.<br />
              <span className="text-white/80 font-medium">Get instant insights in seconds.</span>
            </p>
            <div className="flex gap-3 justify-center flex-wrap mb-6">
              <button onClick={() => nav('/dashboard')} className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-full px-8 py-3.5 text-sm font-semibold flex items-center gap-2 group shadow-lg shadow-indigo-500/25 transition-all">
                Launch Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="border border-white/20 text-white/80 rounded-full px-6 py-3.5 text-sm font-medium hover:bg-white/5 transition-all">
                Explore Features
              </button>
            </div>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><Shield size={12} /> No data stored on servers</span>
              <span className="flex items-center gap-1"><Zap size={12} /> Results in under 3 seconds</span>
              <span className="flex items-center gap-1"><Clock size={12} /> Free tier available</span>
            </p>
          </motion.div>
        </div>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown size={24} className="text-white/30" />
        </motion.div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="py-14 px-6 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="text-center py-4 px-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── Demo Preview ─── */}
      <section className="px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-b border-slate-100">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-400 ml-3 font-medium">DataMind AI Dashboard</span>
          </div>
          {/* Mock dashboard content */}
          <div className="p-6">
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { v: '$1.24M', l: 'Revenue', t: '+12.5%', up: true },
                { v: '2,847', l: 'Active Users', t: '+28.3%', up: true },
                { v: '34.2%', l: 'Conversion', t: '+5.1%', up: true },
                { v: '$436', l: 'Avg. Order', t: '-2.8%', up: false },
              ].map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white border border-slate-100 rounded-xl p-3.5 text-center"
                >
                  <p className="text-lg font-bold text-slate-900">{m.v}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">{m.l}</p>
                  <p className={`text-[11px] font-semibold mt-1 ${m.up ? 'text-emerald-600' : 'text-red-500'}`}>{m.t}</p>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-100 rounded-xl p-4 h-32 flex items-end gap-1.5">
                {[40, 65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                  <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                    className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-t-md" />
                ))}
              </div>
              <div className="border border-slate-100 rounded-xl p-4 h-32 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-24 h-24">
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#f1f5f9" strokeWidth="28"/>
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#6366f1" strokeWidth="28"
                    strokeDasharray="132 308" strokeDashoffset="0" transform="rotate(-90 100 100)"/>
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#22d3ee" strokeWidth="28"
                    strokeDasharray="88 352" strokeDashoffset="-132" transform="rotate(-90 100 100)"/>
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#10b981" strokeWidth="28"
                    strokeDasharray="66 374" strokeDashoffset="-220" transform="rotate(-90 100 100)"/>
                  <circle cx="100" cy="100" r="42" fill="white"/>
                  <text x="100" y="97" textAnchor="middle" fill="#1e293b" fontSize="16" fontWeight="bold">42%</text>
                  <text x="100" y="115" textAnchor="middle" fill="#94a3b8" fontSize="10">Top Segment</text>
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="px-6 py-24 bg-slate-50/50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-sm font-semibold text-indigo-600 mb-3 uppercase tracking-wide">Features</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Everything you need for data insights
            </h2>
            <p className="text-base text-slate-500 max-w-lg mx-auto">Transform raw data into beautiful, actionable dashboards with natural language queries.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-100 rounded-2xl p-7 hover:shadow-lg hover:border-slate-200 transition-all duration-300 group">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-sm`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-sm font-semibold text-indigo-600 mb-3 uppercase tracking-wide">How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Three steps to insights</h2>
            <p className="text-base text-slate-500">From raw data to beautiful dashboards in under 30 seconds.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Upload your CSV', desc: 'Drag and drop any CSV or Excel file. We detect columns and types automatically.', icon: Upload },
              { n: '02', title: 'Ask a question', desc: 'Type your question in plain English. No SQL or coding skills required.', icon: MessageSquare },
              { n: '03', title: 'Get your dashboard', desc: 'Receive instant KPIs, charts, trends, and AI-powered insights.', icon: BarChart3 },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="text-center group">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-colors">
                  <s.icon size={22} className="text-slate-600 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="text-xs font-bold text-indigo-500 mb-2 tracking-wide">STEP {s.n}</div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => nav('/dashboard')} className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-8 py-3.5 text-sm font-semibold inline-flex items-center gap-2 transition-all group shadow-lg shadow-slate-900/10">
              <Sparkles size={16} /> Start Analyzing Your Data <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Team ─── */}
      <section id="team" className="px-6 py-24 bg-slate-50/50">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-sm font-semibold text-indigo-600 mb-3 uppercase tracking-wide">Our Team</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Built with passion</h2>
            <p className="text-base text-slate-500">Crafted for GFG Hackfest 2026</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white border border-slate-100 rounded-2xl p-6 text-center hover:shadow-lg hover:border-slate-200 transition-all duration-300 group">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden ring-2 ring-slate-100 group-hover:ring-indigo-200 transition-all">
                  <img src={m.img} alt={m.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-0.5">{m.name}</h3>
                <p className="text-sm text-indigo-600 font-medium mb-4">{m.role}</p>
                <div className="flex items-center justify-center gap-2">
                  {m.github && (
                    <a href={m.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors p-1.5 hover:bg-slate-100 rounded-lg" title="GitHub">
                      <Github size={16} />
                    </a>
                  )}
                  {m.linkedin && (
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg" title="LinkedIn">
                      <Linkedin size={16} />
                    </a>
                  )}
                  {m.twitter && (
                    <a href={m.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-sky-500 transition-colors p-1.5 hover:bg-sky-50 rounded-lg" title="Twitter">
                      <Twitter size={16} />
                    </a>
                  )}
                  {m.website && (
                    <a href={m.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-600 transition-colors p-1.5 hover:bg-emerald-50 rounded-lg" title="Website">
                      <Globe size={16} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-100 py-8 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center">
              <Database size={12} className="text-white" />
            </div>
            <span className="font-bold text-sm text-slate-900">DataMind AI</span>
          </div>
          <p className="text-xs text-slate-400">Built for GFG Hackfest 2026</p>
          <a href="https://github.com/Sne-04/GFG-Hack-1" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
            <Github size={18} />
          </a>
        </div>
      </footer>
    </div>
  )
}
