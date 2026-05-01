'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Settings, 
  Trash2, 
  FileEdit, 
  BookText, 
  ArrowLeft,
  ChevronRight,
  MoreVertical,
  Library,
  History,
  Download,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

interface Chapter {
  id: string
  title: string
  order: number
  updatedAt: string
}

interface Novel {
  id: string
  title: string
  description?: string | null
  chapters: Chapter[]
}

export default function NovelHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: novelId } = use(params)
  const [novel, setNovel] = useState<Novel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const router = useRouter()

  const fetchNovel = async () => {
    try {
      const res = await fetch(`http://localhost:3000/novels/${novelId}`)
      if (!res.ok) throw new Error('Failed to fetch novel')
      const data = await res.json()
      setNovel(data)
    } catch (error) {
      console.error(error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNovel()
  }, [novelId])

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const nextOrder = (novel?.chapters.length || 0) + 1
      const res = await fetch('http://localhost:3000/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newChapterTitle, 
          novelId, 
          order: nextOrder,
          content: JSON.stringify({ type: 'doc', content: [] }) // Default Tiptap content
        }),
      })
      if (res.ok) {
        setIsChapterModalOpen(false)
        setNewChapterTitle('')
        fetchNovel()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteChapter = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa chương này?')) return
    try {
      const res = await fetch(`http://localhost:3000/chapters/${id}`, { method: 'DELETE' })
      if (res.ok) fetchNovel()
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteNovel = async () => {
    if (!confirm('HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC. Bạn có chắc muốn xóa toàn bộ dự án này?')) return
    try {
      const res = await fetch(`http://localhost:3000/novels/${novelId}`, { method: 'DELETE' })
      if (res.ok) router.push('/')
    } catch (error) {
      console.error(error)
    }
  }

  const handleExport = async (format: 'markdown' | 'txt') => {
    try {
      const response = await fetch(`http://localhost:3000/novels/${novelId}/export/${format}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${novel?.title.replace(/\s+/g, '_')}.${format === 'markdown' ? 'md' : 'txt'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error(error)
      alert('Lỗi khi xuất file')
    }
  }

  if (isLoading) return <div className="p-12 animate-pulse font-serif text-2xl">Đang tải dự án...</div>
  if (!novel) return null

  return (
    <div className="min-h-screen bg-[#fcfaf7]">
      <div className="max-w-6xl mx-auto p-12 space-y-12">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <Link href="/" className="text-slate-400 hover:text-primary flex items-center gap-1 text-sm transition-colors">
              <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
            </Link>
            <h1 className="text-5xl font-serif font-bold text-slate-900">{novel.title}</h1>
            <p className="text-slate-500 max-w-2xl italic leading-relaxed">
              {novel.description || 'Tác phẩm chưa có mô tả...'}
            </p>
          </div>

          <div className="flex gap-3">
             <Link href={`/novels/${novelId}/wiki`}>
                <Button variant="outline" className="rounded-full">
                  <Library className="h-4 w-4 mr-2" />
                  Wiki Nhân vật
                </Button>
             </Link>
             <Link href={`/novels/${novelId}/timeline`}>
                <Button variant="outline" className="rounded-full">
                  <History className="h-4 w-4 mr-2" />
                  Dòng thời gian
                </Button>
             </Link>
             
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    <Download className="h-4 w-4 mr-2" />
                    Xuất bản
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('markdown')}>
                    <FileText className="h-4 w-4 mr-2" /> Xuất bản (.md)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('txt')}>
                    <FileText className="h-4 w-4 mr-2" /> Xuất bản (.txt)
                  </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>

             <Button variant="destructive" size="icon" className="rounded-full" onClick={handleDeleteNovel}>
               <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content - Chapters */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                <BookText className="h-6 w-6 text-primary" />
                Danh sách chương ({novel.chapters.length})
              </h2>
              
              <Dialog open={isChapterModalOpen} onOpenChange={setIsChapterModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5">
                    <Plus className="h-4 w-4 mr-1" /> Thêm chương mới
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-serif">Thêm chương mới</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateChapter} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="chapterTitle">Tiêu đề chương</Label>
                      <Input 
                        id="chapterTitle" 
                        placeholder="VD: Chương 1: Sự khởi đầu" 
                        value={newChapterTitle}
                        onChange={e => setNewChapterTitle(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">Khởi tạo chương</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {novel.chapters.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border-2 border-dashed rounded-2xl">
                  Chưa có chương nào. Hãy tạo chương đầu tiên để bắt đầu viết.
                </div>
              ) : (
                novel.chapters.map((chapter) => (
                  <div 
                    key={chapter.id} 
                    className="group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center font-serif text-slate-400">
                        {chapter.order}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                          {chapter.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Cập nhật: {new Date(chapter.updatedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/edit/${chapter.id}`}>
                        <Button variant="ghost" size="sm">
                          <FileEdit className="h-4 w-4 mr-2" />
                          Viết
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/5" onClick={() => handleDeleteChapter(chapter.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
             <Card className="bg-slate-900 text-white border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif text-lg text-slate-400">Thống kê dự án</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                    <span className="text-slate-400 text-sm">Số chương</span>
                    <span className="text-3xl font-serif font-bold">{novel.chapters.length}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-slate-800 pb-4">
                    <span className="text-slate-400 text-sm">Trạng thái</span>
                    <span className="text-green-400 font-medium">Đang tiến hành</span>
                  </div>
                </CardContent>
             </Card>

             <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-slate-900">Ghi chú nhanh</h3>
                <p className="text-sm text-slate-500 italic">
                  "Viết là một hành trình dài, hãy bắt đầu bằng một câu văn nhỏ."
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
