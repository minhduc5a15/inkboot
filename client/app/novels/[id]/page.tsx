'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  FileText, 
  Trash2, 
  Download, 
  ChevronRight, 
  BarChart3, 
  Clock, 
  BookOpen,
  Users,
  Calendar,
  Settings,
  MoreVertical,
  GripVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Chapter {
  id: string
  title: string
  order: number
  wordCount: number
}

interface SortableChapterProps {
  chapter: Chapter
  novelId: string
  onDelete: (id: string) => void
}

function SortableChapter({ chapter, novelId, onDelete }: SortableChapterProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: chapter.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#262626] rounded-xl hover:border-[#444] transition-all duration-300 ${isDragging ? 'opacity-50 scale-[0.98] shadow-2xl' : ''}`}
    >
      <div className="flex items-center gap-4 flex-1">
        <div {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-[#444] hover:text-[#888] transition-colors">
          <GripVertical size={16} />
        </div>
        <Link href={`/edit/${chapter.id}`} className="flex-1 flex items-center gap-3">
          <div className="p-2 bg-[#262626] rounded-lg text-[#888] group-hover:text-white transition-colors">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="font-serif italic text-lg text-white group-hover:underline">{chapter.title}</h3>
            <span className="text-[10px] uppercase tracking-widest text-[#666] font-bold">CHƯƠNG {chapter.order} • {chapter.wordCount} TỪ</span>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-2">
         <Button
          variant="ghost"
          size="icon"
          className="text-[#444] hover:text-red-400 hover:bg-red-400/10"
          onClick={() => onDelete(chapter.id)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  )
}

export default function NovelHub({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [novel, setNovel] = useState<any>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchData = async () => {
    try {
      const res = await fetch(`http://localhost:3000/novels/${id}`)
      if (!res.ok) throw new Error('Failed to fetch novel')
      
      const data = await res.json()
      setNovel(data)
      setChapters((data.chapters || []).sort((a: any, b: any) => a.order - b.order))

      const statsRes = await fetch(`http://localhost:3000/novels/${id}/stats`)
      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    fetchData()
  })

  const addChapter = async () => {
    const title = prompt('Tiêu đề chương:')
    if (!title) return

    try {
      const res = await fetch('http://localhost:3000/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId: id,
          title,
          order: chapters.length + 1,
          content: '{}'
        })
      })
      if (res.ok) fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const deleteChapter = async (chapterId: string) => {
    if (!confirm('Bạn có chắc muốn xóa chương này?')) return
    try {
      await fetch(`http://localhost:3000/chapters/${chapterId}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex((c) => c.id === active.id)
      const newIndex = chapters.findIndex((c) => c.id === over.id)
      const newChapters = arrayMove(chapters, oldIndex, newIndex)
      
      setChapters(newChapters)

      try {
        await fetch(`http://localhost:3000/novels/${id}/chapters/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            newChapters.map((c, i) => ({ id: c.id, order: i + 1 }))
          )
        })
      } catch (error) {
        console.error('Failed to reorder:', error)
        fetchData()
      }
    }
  }

  const exportNovel = async (format: 'markdown' | 'text') => {
    window.open(`http://localhost:3000/novels/${id}/export?format=${format}`, '_blank')
  }

  if (loading) return null
  if (!novel) return <div className="p-12 text-center text-[#666]">Không tìm thấy tác phẩm.</div>

  const targetWords = 50000;
  const totalWords = novel.totalWords ?? 0;
  const progress = Math.min((totalWords / targetWords) * 100, 100);

  // Calculate Streak and Daily Words
  const getDailyStats = () => {
    if (!stats || stats.length < 2) return { streak: 0, dailyWords: [], avgWords: 0 };
    
    const dailyDiffs = stats.map((log, i) => {
      if (i === 0) return { date: log.date, words: 0 };
      const diff = log.wordCount - stats[i-1].wordCount;
      return { date: log.date, words: Math.max(0, diff) };
    }).slice(-7);

    let streak = 0;
    const sortedStats = [...stats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let lastDate = new Date();
    lastDate.setHours(0,0,0,0);

    for (let i = 0; i < sortedStats.length; i++) {
        const logDate = new Date(sortedStats[i].date);
        logDate.setHours(0,0,0,0);
        
        const diffDays = Math.floor((lastDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
            streak++;
            lastDate = logDate;
        } else {
            break;
        }
    }

    const avgWords = dailyDiffs.reduce((a, b) => a + b.words, 0) / (dailyDiffs.length || 1);
    
    return { streak, dailyWords: dailyDiffs, avgWords };
  };

  const { streak, dailyWords, avgWords } = getDailyStats();
  const daysRemaining = avgWords > 0 ? Math.ceil((targetWords - totalWords) / avgWords) : Infinity;
  const estCompletion = daysRemaining === Infinity ? 'N/A' : new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-12 space-y-16">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#666] font-bold">PROJECT HUB</span>
            <h1 className="text-5xl font-serif italic text-white">{novel.title}</h1>
            <p className="text-[#888] font-serif italic text-lg">{novel.description}</p>
          </div>
          <div className="flex gap-3">
             <Link href={`/novels/${id}/wiki`}>
              <Button variant="outline" className="border-[#262626] bg-[#1a1a1a] hover:bg-[#262626] text-[#888] hover:text-white px-6">
                <Users size={16} className="mr-2" /> WIKI
              </Button>
            </Link>
            <Link href={`/novels/${id}/timeline`}>
              <Button variant="outline" className="border-[#262626] bg-[#1a1a1a] hover:bg-[#262626] text-[#888] hover:text-white px-6">
                <Calendar size={16} className="mr-2" /> TIMELINE
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {[
            { label: 'TỔNG SỐ TỪ', value: totalWords.toLocaleString() },
            { label: 'CHUỖI VIẾT', value: `${streak} NGÀY` },
            { label: 'TB MỖI NGÀY', value: Math.round(avgWords) },
            { label: 'DỰ KIẾN XONG', value: estCompletion },
          ].map((stat, i) => (
            <div key={i} className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#444] font-bold">{stat.label}</span>
              <p className="text-3xl font-serif italic text-white opacity-90">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            <div className="space-y-8">
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-[#444] font-bold">TIẾN ĐỘ BẢN THẢO</span>
                        <span className="text-2xl font-serif italic text-white opacity-90">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-0.5 bg-[#262626]" />
                    <p className="text-[9px] text-[#444] uppercase tracking-[0.2em] text-center font-bold">{totalWords.toLocaleString()} / {targetWords.toLocaleString()} TỪ</p>
                </div>
            </div>

            {/* Simple CSS Chart */}
            <div className="space-y-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#444] font-bold">HOẠT ĐỘNG 7 NGÀY QUA</span>
                <div className="h-24 flex items-end gap-2">
                    {dailyWords.map((day, i) => {
                        const height = Math.max(10, Math.min(100, (day.words / (Math.max(...dailyWords.map(d => d.words)) || 1)) * 100));
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div 
                                    className="w-full bg-[#262626] group-hover:bg-white/20 transition-all duration-500 rounded-t-sm relative"
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {day.words}
                                    </div>
                                </div>
                                <span className="text-[8px] text-[#444] font-bold">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).toUpperCase()}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* Chapters Section */}
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-[#262626] pb-4">
             <h2 className="text-[11px] uppercase tracking-[0.3em] text-[#666] font-bold">DANH SÁCH CHƯƠNG</h2>
             <div className="flex gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-[#666] hover:text-white uppercase tracking-widest text-[10px] font-bold">
                      <Download size={14} className="mr-2" /> XUẤT BẢN
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1a1a] border-[#262626] text-[#d4d4d4]">
                    <DropdownMenuItem onClick={() => exportNovel('markdown')} className="hover:bg-[#262626]">MARKDOWN (.MD)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportNovel('text')} className="hover:bg-[#262626]">TEXT (.TXT)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button onClick={addChapter} className="bg-white text-black hover:bg-white/90 rounded-full px-6 text-[10px] font-bold uppercase tracking-widest shadow-xl">
                  <Plus size={14} className="mr-2" /> CHƯƠNG MỚI
                </Button>
             </div>
          </div>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={chapters.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <SortableChapter 
                    key={chapter.id} 
                    chapter={chapter} 
                    novelId={id}
                    onDelete={deleteChapter}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
