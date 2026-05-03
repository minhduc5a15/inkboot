'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, Users, User, ArrowLeft, MapPin, 
  Shield, ScrollText, Search, Tag as TagIcon, X
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import CharacterSheet from '@/components/CharacterSheet'
import WorldEntitySheet from '@/components/WorldEntitySheet'
import { toast } from 'sonner'

type TabType = 'characters' | 'locations' | 'organizations' | 'lore'

export default function WikiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: novelId } = use(params)
  const [activeTab, setActiveTab] = useState<TabType>('characters')
  const [characters, setCharacters] = useState<any[]>([])
  const [worldEntities, setWorldEntities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form states
  const [newName, setNewName] = useState('')

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [charRes, worldRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/novels/${novelId}/characters`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/world/novel/${novelId}`)
      ])
      setCharacters(await charRes.json())
      setWorldEntities(await worldRes.json())
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [novelId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (activeTab === 'characters') {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/characters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, novelId }),
        })
        const data = await res.json()
        setCharacters([...characters, data])
      } else {
        const typeMap: Record<string, string> = {
          locations: 'location',
          organizations: 'organization',
          lore: 'lore'
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/world`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: newName, 
            novelId, 
            type: typeMap[activeTab] 
          }),
        })
        const data = await res.json()
        setWorldEntities([...worldEntities, data])
      }
      toast.success('Đã tạo thành công')
      setNewName('')
      setIsCreateOpen(false)
    } catch (error) {
      toast.error('Lỗi khi tạo')
    }
  }

  const filteredEntities = () => {
    if (activeTab === 'characters') {
      return characters.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    const typeMap: Record<string, string> = {
      locations: 'location',
      organizations: 'organization',
      lore: 'lore'
    }
    return worldEntities.filter(e => 
      e.type === typeMap[activeTab] && 
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const tabs = [
    { id: 'characters', label: 'Nhân vật', icon: User },
    { id: 'locations', label: 'Địa điểm', icon: MapPin },
    { id: 'organizations', label: 'Tổ chức', icon: Shield },
    { id: 'lore', label: 'Lore / Ghi chú', icon: ScrollText },
  ]

  return (
    <div className="min-h-screen bg-[#161616] text-[#d4d4d4] font-sans">
      <div className="max-w-6xl mx-auto p-12 space-y-12">
        
        {/* Navigation & Header */}
        <div className="flex justify-between items-end border-b border-[#262626] pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[#666]">
              <Link href={`/novels/${novelId}`} className="hover:text-white transition-colors flex items-center gap-2">
                <ArrowLeft size={16} />
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold">Back to Studio</span>
              </Link>
            </div>
            <h1 className="text-6xl font-serif italic text-white tracking-tight opacity-90">Wiki.</h1>
          </div>

          <div className="flex gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" size={16} />
                <Input 
                    placeholder="Tìm kiếm thực thể..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#1a1a1a] border-[#262626] pl-10 h-11 w-64 text-sm"
                />
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-white/90 h-11 px-8 rounded-full font-bold uppercase tracking-widest text-[10px]">
                    <Plus size={16} className="mr-2" /> Thêm {tabs.find(t => t.id === activeTab)?.label}
                </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a1a1a] border-[#262626] text-[#d4d4d4]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-serif italic">Khởi tạo thực thể mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-6 pt-4">
                    <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] uppercase tracking-widest text-[#666]">Tên gọi</Label>
                    <Input 
                        id="name" 
                        placeholder="VD: Avalon, Hội Kín..." 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-[#161616] border-[#262626] h-12"
                        required
                    />
                    </div>
                    <Button type="submit" className="w-full bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] h-12">Khởi tạo</Button>
                </form>
                </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-8 border-b border-[#262626]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-4 text-[11px] uppercase tracking-[0.3em] font-bold transition-all relative ${
                activeTab === tab.id ? 'text-white' : 'text-[#444] hover:text-[#888]'
              }`}
            >
              <div className="flex items-center gap-2">
                <tab.icon size={14} />
                {tab.label}
              </div>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Grid View */}
        <div className="min-h-[50vh]">
            {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-[#1a1a1a] border border-[#262626] rounded animate-pulse" />)}
            </div>
            ) : (
            <motion.div 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {filteredEntities().map((entity) => (
                <Dialog key={entity.id}>
                    <DialogTrigger asChild>
                    <Card className="bg-[#1a1a1a] border-[#262626] hover:border-[#444] transition-all cursor-pointer group rounded-none">
                        <CardHeader className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-[#262626] rounded text-[#888] group-hover:text-white transition-colors">
                                    {activeTab === 'characters' ? <User size={20} /> : 
                                     activeTab === 'locations' ? <MapPin size={20} /> :
                                     activeTab === 'organizations' ? <Shield size={20} /> :
                                     <ScrollText size={20} />}
                                </div>
                                <div className="flex gap-1">
                                    {entity.tags?.map((tag: string) => (
                                        <span key={tag} className="text-[8px] uppercase tracking-widest text-[#444] font-bold border border-[#262626] px-1.5 py-0.5">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-serif italic text-white opacity-90 group-hover:underline">
                                {entity.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-[#666] line-clamp-2 italic font-serif leading-relaxed">
                                {entity.description || entity.personality || 'Chưa có mô tả chi tiết...'}
                            </p>
                        </CardContent>
                    </Card>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1a1a1a] border-[#262626] text-[#d4d4d4] max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-serif italic border-b border-[#262626] pb-4">
                            Hồ sơ: {entity.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="pt-6">
                        {activeTab === 'characters' ? (
                            <CharacterSheet 
                            character={entity} 
                            onSave={(updated) => setCharacters(characters.map(c => c.id === updated.id ? updated : c))}
                            onDelete={(id) => setCharacters(characters.filter(c => c.id !== id))}
                            />
                        ) : (
                            <WorldEntitySheet
                                entity={entity}
                                onSave={(updated) => setWorldEntities(worldEntities.map(e => e.id === updated.id ? updated : e))}
                                onDelete={(id) => setWorldEntities(worldEntities.filter(e => e.id !== id))}
                            />
                        )}
                    </div>
                    </DialogContent>
                </Dialog>
                ))}
            </motion.div>
            )}

            {!isLoading && filteredEntities().length === 0 && (
                <div className="text-center py-32 space-y-4 border border-dashed border-[#262626]">
                    <p className="text-[#666] italic font-serif text-lg">Không tìm thấy thực thể nào trong mục này.</p>
                    <Button variant="ghost" className="text-[10px] uppercase tracking-widest text-white/50" onClick={() => setIsCreateOpen(true)}>
                        Bắt đầu xây dựng thế giới
                    </Button>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
