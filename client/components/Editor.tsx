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
  History, Eye, RotateCcw, Maximize, Minimize, Users,
  Globe, Search as SearchIcon, MapPin, Shield, ScrollText
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'motion/react'
import { useFocus } from '@/lib/focus-context'
import { toast } from 'sonner'

interface ChapterVersion {
  id: string
  content: string
  createdAt: string
}

interface WorldEntity {
  id: string
  name: string
  type: string
  description?: string | null
  content?: string | null
  tags?: string[] | null
}

interface EditorProps {
  id: string
  novelId: string
  initialContent?: string
  title: string
  order: number
  characters: any[]
}

export default function Editor({ id, novelId, initialContent, title, order, characters }: EditorProps) {
  const { isFocusMode, toggleFocusMode } = useFocus()
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [wordCount, setWordCount] = useState(0)
  const [versions, setVersions] = useState<ChapterVersion[]>([])
  const [worldEntities, setWorldEntities] = useState<WorldEntity[]>([])
  const [worldSearch, setWorldSearch] = useState('')

  const fetchWorldEntities = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/world/novel/${novelId}`)
      const data = await res.json()
      setWorldEntities(data)
    } catch (error) {
      console.error('Failed to fetch world entities:', error)
    }
  }

  const calculateStats = (editor: any) => {
    const text = editor.getText()
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    setWordCount(words)
  }

  const fetchVersions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/chapters/${id}/versions`)
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/chapters/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        toast.success('Đã lưu phiên bản mới')
        fetchVersions()
      }
    } catch (error) {
      toast.error('Không thể lưu bản nháp')
    }
  }

  const restoreVersion = async (versionId: string, versionContent: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/chapters/${id}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      })
      
      if (response.ok) {
        const content = JSON.parse(versionContent)
        editor?.commands.setContent(content)
        setSaveStatus('saved')
        toast.success('Đã khôi phục thành công')
      }
    } catch (error) {
      toast.error('Lỗi khi khôi phục')
    }
  }

  const debouncedSave = useDebouncedCallback(async (content: string) => {
    setSaveStatus('saving')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/chapters/${id}`, {
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

  useEffect(() => {
    fetchWorldEntities()
  }, [novelId])

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

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={fetchWorldEntities} variant="ghost" size="icon" className="h-8 w-8 text-[#666] hover:text-white hover:bg-white/5 transition-all">
                          <Globe size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1a1a1a] border-[#262626] text-[#d4d4d4] max-w-xl">
                        <DialogHeader>
                          <DialogTitle className="text-[10px] uppercase tracking-[0.2em] text-[#666]">Worldbuilding / Kiến thức</DialogTitle>
                        </DialogHeader>
                        <div className="relative mt-4">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" size={14} />
                            <Input 
                                placeholder="Tìm kiếm thực thể..." 
                                value={worldSearch}
                                onChange={(e) => setWorldSearch(e.target.value)}
                                className="bg-[#161616] border-[#262626] pl-9 h-10 text-xs"
                            />
                        </div>
                        <ScrollArea className="h-[50vh] pr-4 mt-4">
                          <div className="space-y-4">
                            {worldEntities
                              .filter(e => e.name.toLowerCase().includes(worldSearch.toLowerCase()))
                              .map((entity) => (
                                <Popover key={entity.id}>
                                  <PopoverTrigger asChild>
                                    <div className="p-4 rounded border border-[#262626] bg-[#161616] hover:border-[#444] transition-all cursor-pointer group">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="p-1.5 bg-[#262626] rounded text-[#888] group-hover:text-white">
                                            {entity.type === 'location' ? <MapPin size={14} /> :
                                             entity.type === 'organization' ? <Shield size={14} /> :
                                             <ScrollText size={14} />}
                                          </div>
                                          <h3 className="font-serif italic text-lg text-white group-hover:underline">{entity.name}</h3>
                                        </div>
                                        <span className="text-[8px] uppercase tracking-widest text-[#444] font-bold border border-[#262626] px-1.5 py-0.5 rounded">
                                            {entity.type}
                                        </span>
                                      </div>
                                      <p className="text-xs text-[#666] italic line-clamp-2">{entity.description || 'Không có mô tả.'}</p>
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 bg-[#1a1a1a] border-[#262626] text-[#d4d4d4] p-4 shadow-2xl">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 border-b border-[#262626] pb-2">
                                        <h4 className="font-serif italic text-white text-lg">{entity.name}</h4>
                                      </div>
                                      <p className="text-xs text-[#888] leading-relaxed italic font-serif">
                                        {entity.description}
                                      </p>
                                      {entity.content && (
                                        <div className="text-[12px] text-[#666] leading-relaxed whitespace-pre-wrap pt-2 border-t border-[#262626]">
                                          {entity.content.substring(0, 300)}...
                                        </div>
                                      )}
                                      <div className="flex flex-wrap gap-1 pt-2">
                                        {entity.tags?.map(tag => (
                                          <span key={tag} className="text-[8px] uppercase tracking-widest text-[#444] font-bold">
                                            #{tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ))}
                            {worldEntities.length === 0 && (
                                <p className="text-center text-[#666] text-xs py-8">Chưa có kiến thức thế giới nào.</p>
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
                          <Button onClick={saveSnapshot} variant="outline" className="w-full border-[#262626] hover:bg-[#262626] text-[10px] uppercase tracking-widest font-bold">
                            <Save size={14} className="mr-2" /> Lưu bản nháp
                          </Button>
                          {versions.map((v) => (
                            <div key={v.id} className="p-4 rounded border border-[#262626] bg-[#161616] space-y-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-[#666] font-mono">{new Date(v.createdAt).toLocaleString()}</span>
                                <span className="text-[9px] uppercase tracking-widest text-[#444] font-bold">Snapshotted</span>
                              </div>
                              <div className="flex gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-[10px] uppercase tracking-widest h-8 px-4 border border-[#262626] hover:bg-[#262626]">Xem</Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-[#1a1a1a] border-[#262626] text-[#d4d4d4] max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="text-[10px] uppercase tracking-[0.2em] text-[#666]">Xem phiên bản ({new Date(v.createdAt).toLocaleDateString()})</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4 font-serif text-[#888] italic leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto pr-4">
                                      {(() => {
                                        try {
                                          const contentObj = JSON.parse(v.content)
                                          const getText = (node: any): string => {
                                            if (node.type === 'text') return node.text || ''
                                            if (node.content) return node.content.map(getText).join(node.type === 'paragraph' ? '\n' : ' ')
                                            if (node.type === 'paragraph') return '\n'
                                            return ''
                                          }
                                          return getText(contentObj).trim().substring(0, 2000) + (v.content.length > 2000 ? '...' : '')
                                        } catch (e) {
                                          return 'Không thể hiển thị nội dung.'
                                        }
                                      })()}
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="secondary" className="text-[10px] uppercase tracking-widest h-8 px-4 bg-[#262626] hover:bg-[#333]">Khôi phục</Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-[#1a1a1a] border-[#262626] text-[#d4d4d4]">
                                    <DialogHeader>
                                      <DialogTitle className="text-xl font-serif italic">Xác nhận khôi phục?</DialogTitle>
                                    </DialogHeader>
                                    <p className="text-sm text-[#888] py-4">Nội dung hiện tại của chương sẽ được ghi đè bởi phiên bản này. Bạn có muốn tiếp tục?</p>
                                    <div className="flex justify-end gap-3 mt-4">
                                       <Button variant="ghost" className="text-[10px] uppercase tracking-widest">Hủy</Button>
                                       <Button onClick={() => restoreVersion(v.id, v.content)} className="bg-white text-black hover:bg-white/90 text-[10px] uppercase tracking-widest font-bold px-6">Xác nhận</Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
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
