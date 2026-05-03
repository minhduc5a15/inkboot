'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Trash2 } from 'lucide-react'

interface Character {
  id: string
  name: string
  age?: number | null
  appearance?: string | null
  personality?: string | null
  history?: string | null
  novelId: string
}

interface CharacterSheetProps {
  character: Character
  onSave?: (updated: Character) => void
  onDelete?: (id: string) => void
}

export default function CharacterSheet({ character, onSave, onDelete }: CharacterSheetProps) {
  const [formData, setFormData] = useState(character)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('Failed to save character')
      const updated = await response.json()
      onSave?.(updated)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa nhân vật này?')) return
    setIsDeleting(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/characters/${character.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete character')
      onDelete?.(character.id)
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tên nhân vật</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Tuổi</Label>
          <Input
            id="age"
            type="number"
            value={formData.age || ''}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || null })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="appearance">Ngoại hình</Label>
        <Textarea
          id="appearance"
          rows={4}
          placeholder="Mô tả ngoại hình..."
          value={formData.appearance || ''}
          onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="personality">Tính cách</Label>
        <Textarea
          id="personality"
          rows={4}
          placeholder="Mô tả tính cách..."
          value={formData.personality || ''}
          onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="history">Tiểu sử / Quá khứ</Label>
        <Textarea
          id="history"
          rows={6}
          placeholder="Mô tả quá khứ..."
          value={formData.history || ''}
          onChange={(e) => setFormData({ ...formData, history: e.target.value })}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Xóa
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Lưu thay đổi
        </Button>
      </div>
    </div>
  )
}
