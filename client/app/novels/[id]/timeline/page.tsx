'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, History, Calendar, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface TimelineEvent {
  id: string
  title: string
  content?: string | null
  datePoint?: string | null
  novelId: string
}

export default function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: novelId } = use(params)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', content: '', datePoint: '' })

  const fetchEvents = async () => {
    try {
      const res = await fetch(`http://localhost:3000/novels/${novelId}/timeline`)
      const data = await res.json()
      setEvents(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [novelId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:3000/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEvent, novelId }),
      })
      if (res.ok) {
        setIsModalOpen(false)
        setNewEvent({ title: '', content: '', datePoint: '' })
        fetchEvents()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa sự kiện này?')) return
    try {
      const res = await fetch(`http://localhost:3000/timeline/${id}`, { method: 'DELETE' })
      if (res.ok) fetchEvents()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7] p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/novels/${novelId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
                <History className="h-8 w-8 text-primary" />
                Dòng thời gian
              </h1>
              <p className="text-muted-foreground italic">Ghi lại các cột mốc lịch sử trong tác phẩm</p>
            </div>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm cột mốc
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo sự kiện mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="datePoint">Mốc thời gian</Label>
                  <Input 
                    id="datePoint" 
                    placeholder="VD: Mùa Xuân, Năm 120" 
                    value={newEvent.datePoint}
                    onChange={e => setNewEvent({...newEvent, datePoint: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Sự kiện chính</Label>
                  <Input 
                    id="title" 
                    placeholder="Tiêu đề sự kiện..." 
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Chi tiết</Label>
                  <Textarea 
                    id="content" 
                    placeholder="Mô tả điều gì đã xảy ra..." 
                    value={newEvent.content}
                    onChange={e => setNewEvent({...newEvent, content: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full">Thêm vào dòng thời gian</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-8 pl-8 border-l-2 border-slate-200">
            {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-200">
            {events.length === 0 ? (
              <p className="text-slate-400 italic">Chưa có sự kiện nào được ghi lại.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[41px] top-1.5 h-4 w-4 rounded-full bg-white border-4 border-primary shadow-sm" />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm uppercase tracking-wider">{event.datePoint || 'Không rõ thời điểm'}</span>
                    </div>
                    <Card className="hover:shadow-md transition-shadow group">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="font-serif text-xl">{event.title}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-600 whitespace-pre-wrap">{event.content}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
