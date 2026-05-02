'use client'

import { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Users, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import CharacterSheet from '@/components/CharacterSheet'

interface Character {
  id: string
  name: string
  age?: number | null
  appearance?: string | null
  personality?: string | null
  history?: string | null
  novelId: string
}

export default function WikiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: novelId } = use(params)
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    fetch(`http://localhost:3000/novels/${novelId}/characters`)
      .then(res => res.json())
      .then(data => {
        setCharacters(data)
        setIsLoading(false)
      })
  }, [novelId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('http://localhost:3000/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, novelId }),
      })
      const newChar = await response.json()
      setCharacters([...characters, newChar])
      setNewName('')
      setIsCreateOpen(false)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Wiki Nhân vật
              </h1>
              <p className="text-muted-foreground italic">Quản lý hồ sơ nhân vật trong tiểu thuyết của bạn</p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm nhân vật
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo nhân vật mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên nhân vật</Label>
                  <Input 
                    id="name" 
                    placeholder="VD: Nguyễn Văn A" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Khởi tạo</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((char) => (
              <Dialog key={char.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-serif">{char.name}</CardTitle>
                        {char.age && <p className="text-sm text-muted-foreground">{char.age} tuổi</p>}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 italic">
                        {char.personality || 'Chưa có mô tả tính cách...'}
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-serif">Hồ sơ: {char.name}</DialogTitle>
                  </DialogHeader>
                  <div className="pt-6">
                    <CharacterSheet 
                      character={char} 
                      onSave={(updated) => setCharacters(characters.map(c => c.id === updated.id ? updated : c))}
                      onDelete={(id) => setCharacters(characters.filter(c => c.id !== id))}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
