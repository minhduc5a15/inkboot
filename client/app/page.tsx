'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Book, Trash2, ChevronRight, Library as LibraryIcon, Search, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'motion/react'

interface Novel {
  id: string
  title: string
  description: string | null
  totalWords: number
  updatedAt: string
}

export default function Library() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNovels = async () => {
    try {
      const res = await fetch('http://localhost:3000/novels')
      const data = await res.json()
      setNovels(data)
    } catch (error) {
      console.error('Failed to fetch novels:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNovels()
  }, [])

  const createNovel = async () => {
    const title = prompt('Tiêu đề tiểu thuyết:')
    if (!title) return

    try {
      const res = await fetch('http://localhost:3000/novels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: 'Một câu chuyện mới...' }),
      })
      if (res.ok) fetchNovels()
    } catch (error) {
      console.error(error)
    }
  }

  const deleteNovel = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tiểu thuyết này? Toàn bộ chương và dữ liệu sẽ mất.')) return
    try {
      await fetch(`http://localhost:3000/novels/${id}`, { method: 'DELETE' })
      fetchNovels()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-12 space-y-16">
        
        {/* Hero Section */}
        <div className="flex justify-between items-end border-b border-[#262626] pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#666]">
              <LibraryIcon size={16} />
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold">Manuscripts</span>
            </div>
            <h1 className="text-6xl font-serif italic text-white tracking-tight opacity-90">Studio</h1>
          </div>
          
          <Button 
            onClick={createNovel}
            className="bg-[#ffffff0a] hover:bg-[#ffffff10] text-white border border-[#ffffff10] rounded h-11 px-8 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
          >
            <Plus size={16} className="mr-2" /> New Project
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-[#1a1a1a] border border-[#262626] rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.isArray(novels) && novels.map((novel) => (
              <motion.div 
                key={novel.id}
                whileHover={{ y: -2 }}
                className="group relative bg-[#1a1a1a] border border-[#262626] rounded p-8 flex flex-col justify-between hover:border-[#444] transition-all duration-300"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-[#262626] rounded text-[#888] group-hover:text-white transition-colors">
                      <FileText size={20} />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => { e.preventDefault(); deleteNovel(novel.id); }}
                      className="text-[#444] hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl font-serif italic text-white opacity-90 group-hover:underline">
                      <Link href={`/novels/${novel.id}`}>{novel.title}</Link>
                    </h2>
                    <p className="text-sm text-[#666] line-clamp-2 italic font-serif leading-relaxed">
                      {novel.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#262626] flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#444] font-bold">Word Count</span>
                    <span className="text-sm font-mono text-[#888]">{(novel.totalWords ?? 0).toLocaleString()}</span>
                  </div>
                  <Link href={`/novels/${novel.id}`}>
                    <Button variant="ghost" size="sm" className="text-[#666] hover:text-white text-[10px] uppercase tracking-widest font-bold">
                      Open <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {novels.length === 0 && !loading && (
          <div className="text-center py-32 space-y-6 border border-dashed border-[#262626] rounded">
             <div className="p-6 bg-[#1a1a1a] rounded w-fit mx-auto text-[#444]">
                <Plus size={48} />
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-serif italic text-[#888]">No manuscripts found</h3>
                <p className="text-[#666] text-sm">Start your creative journey today.</p>
             </div>
             <Button onClick={createNovel} className="bg-[#262626] text-white hover:bg-[#333]">Create First Story</Button>
          </div>
        )}
      </div>
    </div>
  )
}
