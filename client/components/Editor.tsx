'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { useDebouncedCallback } from 'use-debounce'
import { useState, useEffect } from 'react'
import { 
  Bold, Italic, Underline as UnderlineIcon, List, 
  Save, CloudCheck, Loader2, Gauge, Clock, Target,
  History, Eye, RotateCcw, Maximize, Minimize, Users
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'motion/react'
import { useFocus } from '@/lib/focus-context'

interface ChapterVersion {
  id: string
  content: string
  createdAt: string
}

interface EditorProps {
  id: string
  initialContent?: string
  title: string
  order: number
  characters: any[]
}

export default function Editor({ id, initialContent, title, order, characters }: EditorProps) {
  const { isFocusMode, toggleFocusMode } = useFocus()
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [wordCount, setWordCount] = useState(0)
  const [versions, setVersions] = useState<ChapterVersion[]>([])

  const calculateStats = (editor: any) => {
    const text = editor.getText()
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    setWordCount(words)
  }

  const fetchVersions = async () => {
    try {
      const res = await fetch(`http://localhost:3000/chapters/${id}/versions`)
      const data = await res.json()
      setVersions(data)
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    }
  }

  const saveSnapshot = async () => {
    if (!editor) return
    try {
      const content = JSON.stringify(editor.getJSON())
      await fetch(`http://localhost:3000/chapters/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      fetchVersions()
    } catch (error) {
      console.error('Failed to save snapshot:', error)
    }
  }

  const restoreVersion = async (version: ChapterVersion) => {
    if (!confirm('Bạn có chắc muốn khôi phục phiên bản này?')) return
    try {
      const content = JSON.parse(version.content)
      editor?.commands.setContent(content)
      await fetch(`http://localhost:3000/chapters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: version.content }),
      })
      setSaveStatus('saved')
    } catch (error) {
      console.error('Failed to restore version:', error)
    }
  }

  const debouncedSave = useDebouncedCallback(async (content: string) => {
    setSaveStatus('saving')
    try {
      const response = await fetch(`http://localhost:3000/chapters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) throw new Error('Failed to save')
      setSaveStatus('saved')
    } catch (error) {
      console.error('Auto-save error:', error)
      setSaveStatus('error')
    }
  }, 2000)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Bắt đầu câu chuyện của bạn...',
      }),
    ],
    content: (() => {
      if (!initialContent) return ''
      try {
        return JSON.parse(initialContent)
      } catch (e) {
        return ''
      }
    })(),
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none max-w-none font-serif text-[19px] leading-[1.8] text-[#c0c0c0] transition-all duration-500 dark:prose-invert text-justify',
      },
    },
    onUpdate: ({ editor }) => {
      calculateStats(editor)
      const json = JSON.stringify(editor.getJSON())
      debouncedSave(json)
    },
    onTransaction: ({ editor }) => {
      calculateStats(editor)
    }
  })

  if (!editor) return null

  return (
    <div className={`flex-1 overflow-y-auto px-6 md:px-20 pt-12 pb-32 flex justify-center transition-all duration-700 ${isFocusMode ? 'pt-[15vh]' : ''}`}>
      
      {/* Lumina-style Focus Mode Exit */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleFocusMode}
            className="absolute top-8 right-8 p-2.5 rounded-full bg-[#ffffff1a] text-[#888] hover:text-white hover:bg-[#ffffff2a] transition-colors z-[150] backdrop-blur-md border border-[#ffffff10]"
            title="Exit Focus Mode"
          >
            <Minimize size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="max-w-2xl w-full">
        {/* Unified Header & Toolbar */}
        <header className="mb-6 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
           <div className="flex flex-col space-y-2">
               <span className="text-[10px] uppercase tracking-[0.3em] text-[#666] font-semibold">Chương {order}</span>
               <input
                type="text"
                readOnly
                value={title}
                className="w-full bg-transparent border-none outline-none text-4xl font-serif text-white italic opacity-90 leading-tight tracking-tight"
              />
           </div>

           <div className="flex items-center gap-4">
              {/* Toolbar (Integrated into Header) */}
              <AnimatePresence>
                {!isFocusMode && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-0.5 p-0.5 bg-[#1a1a1a]/40 backdrop-blur border border-[#333] rounded-md shadow-sm"
                  >
                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded hover:bg-[#333] transition-colors ${editor.isActive('bold') ? 'bg-[#333] text-white' : 'text-[#888]'}`}
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded hover:bg-[#333] transition-colors ${editor.isActive('italic') ? 'bg-[#333] text-white' : 'text-[#888]'}`}
                    >
                      <Italic size={14} />
                    </button>
                    <div className="w-px h-3 bg-[#333] mx-1" />
                    <button
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded hover:bg-[#333] transition-colors ${editor.isActive('bulletList') ? 'bg-[#333] text-white' : 'text-[#888]'}`}
                    >
                      <List size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isFocusMode && (
                <div className="flex gap-2">
                  <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#666] hover:text-white hover:bg-white/5 transition-all">
                          <Users size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1a1a1a] border-[#262626] text-[#d4d4d4]">
                        <DialogHeader>
                          <DialogTitle className="text-[10px] uppercase tracking-[0.2em] text-[#666]">Nhân vật tham chiếu</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-[50vh] pr-4 mt-4">
                          <div className="space-y-6">
                            {!Array.isArray(characters) || characters.length === 0 ? (
                              <p className="text-center text-[#666] text-xs py-8">Chưa có nhân vật nào.</p>
                            ) : (
                              characters.map((char: any) => (
                                <div key={char.id} className="space-y-2 pb-4 border-b border-[#262626] last:border-0">
                                  <h3 className="font-serif italic text-lg text-white">{char.name}</h3>
                                  <p className="text-sm text-[#888] italic">{char.appearance}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button onClick={fetchVersions} variant="ghost" size="icon" className="h-8 w-8 text-[#666] hover:text-white hover:bg-white/5">
                          <History size={16} />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="bg-[#1a1a1a] border-l border-[#262626] text-[#d4d4d4]">
                        <SheetHeader>
                          <SheetTitle className="text-[10px] uppercase tracking-[0.2em] text-[#666]">Lịch sử phiên bản</SheetTitle>
                        </SheetHeader>
                        <div className="mt-8 space-y-4">
                          <Button onClick={saveSnapshot} variant="outline" className="w-full border-[#262626] hover:bg-[#262626]">
                            <Save size={14} className="mr-2" /> Lưu bản nháp
                          </Button>
                          {versions.map((v) => (
                            <div key={v.id} className="p-4 rounded-lg border border-[#262626] bg-[#161616] space-y-3">
                              <span className="text-[10px] text-[#666] font-mono">{new Date(v.createdAt).toLocaleString()}</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="text-xs" onClick={() => editor?.commands.setContent(JSON.parse(v.content))}>Xem</Button>
                                <Button size="sm" variant="secondary" className="text-xs bg-[#262626]" onClick={() => restoreVersion(v)}>Khôi phục</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </SheetContent>
                    </Sheet>
                </div>
              )}
           </div>
        </header>

        {/* Editor Content Area with Separator */}
        <div className={`min-h-[80vh] transition-all duration-700 ${!isFocusMode ? 'border-t border-[#333] pt-6 mt-4' : ''}`}>
          <EditorContent editor={editor} />
        </div>

        {/* Floating Stats */}
        <div className="fixed bottom-10 left-0 right-0 z-[120] pointer-events-none group px-8">
          <div className="max-w-5xl mx-auto flex justify-between items-end">
            <AnimatePresence>
              {!isFocusMode ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-6 text-[11px] tracking-widest uppercase text-white font-medium opacity-30 pointer-events-auto"
                >
                  <span>{wordCount} WORDS</span>
                  <div className="h-3 w-px bg-white opacity-20" />
                  <span>{Math.ceil(wordCount / 200)} MINS</span>
                  <div className="h-3 w-px bg-white opacity-20" />
                  <div className="flex items-center gap-2">
                    {saveStatus === 'saving' ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CloudCheck size={12} className="text-emerald-500" />
                    )}
                    <span className="opacity-60">{saveStatus}</span>
                  </div>
                </motion.div>
              ) : (
                <div className="opacity-0 group-hover:opacity-30 transition-opacity duration-500 text-[10px] text-white uppercase tracking-[0.4em] pb-4">
                  ALT + F TO EXIT
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
