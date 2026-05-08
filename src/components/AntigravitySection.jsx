import { motion } from 'framer-motion'

export default function AntigravitySection() {
  return (
    <section className="relative w-full overflow-hidden bg-white py-24 md:py-32 font-sans border-t border-slate-100">
      {/* Extremely sparse dot background mimicking the screenshot */}
      <div 
        className="absolute inset-0 z-0 opacity-30 pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
          backgroundSize: '48px 48px',
          backgroundPosition: '0 0'
        }} 
      />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-6 md:gap-12">
        
        {/* Left Card: Developers */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/60 backdrop-blur-xl border border-slate-100/50 rounded-[2rem] p-10 md:p-16 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px]"
        >
          {/* Decorative Curly Braces matching screenshot */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <svg viewBox="0 0 500 500" className="w-[120%] h-[120%] max-w-none text-blue-600">
              <text 
                x="50%" 
                y="55%" 
                fontSize="400" 
                textAnchor="middle" 
                dominantBaseline="middle"
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeDasharray="4 12" 
                strokeLinecap="round"
                className="font-mono tracking-widest"
              >
                {'{ }'}
              </text>
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col items-center">
            <span className="px-4 py-1.5 rounded-full border border-slate-200 bg-white/50 text-[11px] font-semibold text-slate-600 mb-8 tracking-wide">
              Available at no charge
            </span>
            <h2 className="text-4xl md:text-5xl font-normal tracking-tight text-slate-900 mb-2">
              For developers
            </h2>
            <p className="text-2xl md:text-3xl font-light text-slate-500 mb-12 tracking-tight">
              Achieve new heights
            </p>
            <button className="bg-[#0f172a] text-white rounded-full px-8 py-3 text-[15px] font-medium hover:bg-black transition-colors shadow-lg shadow-slate-900/10">
              Download
            </button>
          </div>
        </motion.div>

        {/* Right Card: Organizations */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white/60 backdrop-blur-xl border border-slate-100/50 rounded-[2rem] p-10 md:p-16 flex flex-col items-center justify-center text-center relative min-h-[500px]"
        >
          <div className="relative z-10 flex flex-col items-center">
            <span className="px-4 py-1.5 rounded-full border border-slate-200 bg-white/50 text-[11px] font-semibold text-slate-600 mb-8 tracking-wide">
              Coming soon
            </span>
            <h2 className="text-4xl md:text-5xl font-normal tracking-tight text-slate-900 mb-2">
              For organizations
            </h2>
            <p className="text-2xl md:text-3xl font-light text-slate-500 mb-12 tracking-tight">
              Level up your entire team
            </p>
            <button className="bg-transparent border border-slate-300 text-slate-700 rounded-full px-8 py-3 text-[15px] font-medium hover:bg-slate-50 transition-colors">
              Notify me
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
