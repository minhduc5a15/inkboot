'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Users, 
  MapPin, 
  Shield, 
  ScrollText, 
  Search as SearchIcon, 
  ChevronLeft,
  Filter,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import EntityModal from '@/components/EntityModal'

interface Character {
  id: string
  name: string
  appearance?: string
  personality?: string
  history?: string
}

interface WorldEntity {
  id: string
  name: string
  type: string
  description?: string
  content?: string
  tags?: string[]
}

export default function WikiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: novelId } = use(params)
  const [characters, setCharacters] = useState<Character[]>([])
  const [worldEntities, setWorldEntities] = useState<WorldEntity[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<WorldEntity | null>(null)

  const fetchData = async () => {
    try {
      const [charRes, worldRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/novels/${novelId}/characters`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/world/novel/${novelId}`)
      ])
      
      if (charRes.ok) setCharacters(await charRes.json())
      if (worldRes.ok) setWorldEntities(await worldRes.json())
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu Wiki')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [novelId])

  const deleteEntity = async (id: string, isCharacter: boolean) => {
    if (!confirm('Xóa thực thể này?')) return
    try {
      const url = isCharacter 
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/characters/${id}`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/world/${id}`
      
      const res = await fetch(url, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Đã xóa')
        fetchData()
      }
    } catch (error) {
      toast.error('Lỗi khi xóa')
    }
  }

  const filteredEntities = (type: string | 'all' | 'character') => {
    if (type === 'character') {
      return characters.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    }
    return worldEntities.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase())
      const matchesType = type === 'all' ? true : e.type === type
      return matchesSearch && matchesType
    })
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  const EntityCard = ({ data, isCharacter = false }: { data: any, isCharacter?: boolean }) => (
    <motion.div variants={item}>
      <Card 
        className="bg-[#1a1a1a] border-[#262626] hover:border-[#444] transition-all group cursor-pointer relative overflow-hidden h-full"
        onClick={() => {
          setSelectedEntity({...data, type: isCharacter ? 'character' : data.type})
          setIsModalOpen(true)
        }}
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-[#333] group-hover:bg-white transition-colors" />
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#262626] rounded text-[#888] group-hover:text-white transition-colors">
                {isCharacter ? <Users size={14} /> : 
                 data.type === 'location' ? <MapPin size={14} /> :
                 data.type === 'organization' ? <Shield size={14} /> :
                 <ScrollText size={14} />}
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#666]">
                {isCharacter ? 'Nhân vật' : data.type}
              </span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-[#666] hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEntity({...data, type: isCharacter ? 'character' : data.type})
                  setIsModalOpen(true)
                }}
              >
                <Edit2 size={14} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-[#666] hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteEntity(data.id, isCharacter)
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          <CardTitle className="font-serif italic text-xl text-white mt-2 group-hover:underline">
            {data.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#888] line-clamp-3 italic font-serif leading-relaxed">
            {isCharacter ? data.personality : data.description}
          </p>
          <div className="flex flex-wrap gap-1 mt-4">
            {(data.tags || []).slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 bg-[#262626] text-[#666] rounded font-bold">
                {tag}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-[#161616]">
      <div className="max-w-7xl mx-auto p-12 space-y-12">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-[#262626] pb-8">
          <div className="space-y-4">
            <Link href={`/novels/${novelId}`} className="text-[#666] hover:text-white flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold transition-colors">
              <ChevronLeft size={14} /> Trở về Hub
            </Link>
            <h1 className="text-5xl font-serif italic text-white">World Wiki</h1>
            <p className="text-[#888] font-serif italic text-lg">Hệ thống thực thể và kiến thức thế giới</p>
          </div>
          <Button 
            onClick={() => {
              setSelectedEntity(null)
              setIsModalOpen(true)
            }}
            className="bg-white text-black hover:bg-white/90 rounded-full px-8 text-[11px] font-bold uppercase tracking-widest shadow-2xl h-12"
          >
            <Plus size={16} className="mr-2" /> Thêm kiến thức
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]" size={18} />
            <Input 
              placeholder="Tìm kiếm trong Wiki..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#1a1a1a] border-[#262626] pl-12 h-12 text-lg font-serif italic"
            />
          </div>
          <Button variant="outline" className="border-[#262626] bg-[#1a1a1a] h-12 px-6">
            <Filter size={18} className="mr-2" /> Bộ lọc
          </Button>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="all" className="space-y-8">
          <TabsList className="bg-[#1a1a1a] border-[#262626] p-1 h-12">
            <TabsTrigger value="all" className="px-8 text-[10px] uppercase tracking-[0.2em] font-bold">Tất cả</TabsTrigger>
            <TabsTrigger value="character" className="px-8 text-[10px] uppercase tracking-[0.2em] font-bold">Nhân vật</TabsTrigger>
            <TabsTrigger value="location" className="px-8 text-[10px] uppercase tracking-[0.2em] font-bold">Địa điểm</TabsTrigger>
            <TabsTrigger value="organization" className="px-8 text-[10px] uppercase tracking-[0.2em] font-bold">Tổ chức</TabsTrigger>
            <TabsTrigger value="lore" className="px-8 text-[10px] uppercase tracking-[0.2em] font-bold">Lore / Vật phẩm</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {['all', 'character', 'location', 'organization', 'lore'].map(tab => (
              <TabsContent key={tab} value={tab}>
                <motion.div 
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {tab === 'all' && (
                    <>
                      {characters.map(c => <EntityCard key={c.id} data={c} isCharacter />)}
                      {worldEntities.map(e => <EntityCard key={e.id} data={e} />)}
                    </>
                  )}
                  {tab === 'character' && characters.map(c => <EntityCard key={c.id} data={c} isCharacter />)}
                  {tab !== 'all' && tab !== 'character' && worldEntities.filter(e => e.type === tab || (tab === 'lore' && e.type === 'item')).map(e => <EntityCard key={e.id} data={e} />)}
                </motion.div>
                
                {filteredEntities(tab as any).length === 0 && (
                  <div className="py-24 text-center space-y-4">
                    <p className="text-[#444] font-serif italic text-xl">Chưa có dữ liệu cho mục này...</p>
                    <Button variant="link" className="text-[#666]" onClick={() => setIsModalOpen(true)}>Bắt đầu xây dựng ngay</Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>
      </div>

      <EntityModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entity={selectedEntity}
        novelId={novelId}
        allEntities={[
          ...characters.map(c => ({...c, type: 'character'})),
          ...worldEntities
        ]}
        onSuccess={fetchData}
        isCharacter={selectedEntity?.type === 'character'}
      />
    </div>
  )
}
