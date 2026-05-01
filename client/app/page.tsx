'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, BookOpen, Clock, ChevronRight, BookPlus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Novel {
  id: string
  title: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

export default function HomePage() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newNovel, setNewNovel] = useState({ title: '', description: '' })
  const router = useRouter()

  const fetchNovels = async () => {
    try {
      const res = await fetch('http://localhost:3000/novels')
      const data = await res.json()
      setNovels(data)
    } catch (error) {
      console.error('Failed to fetch novels:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNovels()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:3000/novels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNovel),
      })
      if (res.ok) {
        setIsModalOpen(false)
        setNewNovel({ title: '', description: '' })
        fetchNovels()
      }
    } catch (error) {
      console.error('Failed to create novel:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Card key={i} className="h-48 animate-pulse bg-slate-100" />)}
      </div>
    )
  }

  return (
    <div className="p-12 max-w-7xl mx-auto space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-bold text-slate-900">Dự án của tôi</h1>
          <p className="text-slate-500 mt-2">Quản lý và sáng tác các tác phẩm của bạn</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-6 py-6 h-auto shadow-lg shadow-primary/20">
              <Plus className="h-5 w-5 mr-2" />
              Tạo tiểu thuyết mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Khởi tạo tác phẩm</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input 
                  id="title" 
                  placeholder="VD: Chuyến hành trình cuối cùng" 
                  value={newNovel.title}
                  onChange={e => setNewNovel({...newNovel, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả tóm tắt</Label>
                <Textarea 
                  id="description" 
                  placeholder="Giới thiệu sơ lược về tác phẩm..." 
                  value={newNovel.description}
                  onChange={e => setNewNovel({...newNovel, description: e.target.value})}
                  rows={4}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full h-12">Bắt đầu viết</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {novels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
            <BookPlus className="h-10 w-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900">Chưa có tác phẩm nào</h2>
          <p className="text-slate-500 mt-2 mb-8">Hãy bắt đầu hành trình sáng tác bằng cách tạo tiểu thuyết đầu tiên.</p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
            Tạo ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {novels.map((novel) => (
            <Link key={novel.id} href={`/novels/${novel.id}`}>
              <Card className="group hover:border-primary/50 transition-all duration-300 cursor-pointer h-full flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl group-hover:text-primary transition-colors">
                    {novel.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 mt-2 min-h-[4.5rem]">
                    {novel.description || 'Chưa có mô tả cho tác phẩm này...'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto pt-6 border-t flex justify-between items-center text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Cập nhật: {new Date(novel.updatedAt).toLocaleDateString('vi-VN')}
                  </div>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
