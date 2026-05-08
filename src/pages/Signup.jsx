import { SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Database } from 'lucide-react'

export default function Signup() {
  return (
    <div className="min-h-screen bg-black/20 backdrop-blur-md flex flex-col items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Database size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">DataMind AI</span>
          </Link>
        </div>
        
        <div className="flex justify-center">
          <SignUp 
            routing="path" 
            path="/signup" 
            signInUrl="/login" 
            forceRedirectUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: '#6366f1',
                colorBackground: '#13141f',
                colorText: '#f1f5f9',
                colorInputBackground: 'transparent',
                colorInputText: '#f1f5f9',
              },
              elements: {
                card: "bg-transparent border border-white/5 shadow-none",
                headerTitle: "text-white",
                headerSubtitle: "text-slate-400",
                socialButtonsBlockButton: "border-white/10 hover:bg-white/5 text-slate-300",
                socialButtonsBlockButtonText: "text-slate-300 font-medium",
                dividerLine: "bg-white/10",
                dividerText: "text-slate-500",
                formFieldLabel: "text-slate-400 text-xs font-medium",
                formFieldInput: "bg-[#1e1f2e]/50 border-white/10 focus:border-primary/40 text-sm py-2.5",
                formButtonPrimary: "bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-semibold shadow-lg shadow-primary/20 transition-all",
                footerActionText: "text-slate-500",
                footerActionLink: "text-primary hover:text-primary/80",
                identityPreviewText: "text-slate-300",
                identityPreviewEditButton: "text-primary hover:text-primary/80"
              }
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}
