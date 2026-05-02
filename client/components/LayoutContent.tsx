'use client'

import { useFocus } from "@/lib/focus-context"
import Navbar from "./Navbar"
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { PanelLeft, PanelRight } from 'lucide-react'

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isFocusMode, toggleFocusMode } = useFocus()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isFocusMode ? 'dark bg-[#161616]' : 'bg-[#161616]'}`}>
      
      {/* Lumina Top Header */}
      <AnimatePresence>
        {!isFocusMode && (
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="h-12 flex items-center justify-between px-10 opacity-30 flex-shrink-0 z-10 border-b border-[#262626]"
          >
            <div className="flex items-center space-x-4 text-[11px] tracking-widest uppercase text-white font-medium">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`transition-colors flex items-center ${sidebarOpen ? 'text-white' : 'text-[#666] hover:text-white'}`}
              >
                <PanelLeft size={16} className="mr-2" />
                <span>Menu</span>
              </button>
              <div className="h-3 w-px bg-white opacity-20" />
              <span className="opacity-80">Inkboot &mdash; Studio</span>
            </div>
            
            <div className="flex items-center space-x-6 text-[11px] tracking-widest uppercase text-white font-medium">
              <button 
                onClick={toggleFocusMode}
                className="text-[#666] hover:text-white transition-colors"
              >
                FOCUS MODE (ALT+F)
              </button>
              <div className="h-3 w-px bg-white opacity-20" />
              <button className="text-[#666] hover:text-white transition-colors flex items-center">
                <span>Muse</span>
                <PanelRight size={16} className="ml-2" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && !isFocusMode && (
            <motion.div
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex-shrink-0"
            >
              <Navbar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 h-full flex flex-col relative bg-[var(--color-bg-base)] overflow-hidden">
          <div className={`flex-1 overflow-auto transition-colors duration-700 ${isFocusMode ? 'scrollbar-hide' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
