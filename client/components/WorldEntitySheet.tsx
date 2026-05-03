'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'

interface WorldEntity {
  id: string
  name: string
  type: string
  description?: string | null
  content?: string | null
  tags?: string[] | null
  novelId: string
}

interface WorldEntitySheetProps {
  entity: WorldEntity
  onSave?: (updated: WorldEntity) => void
  onDelete?: (id: string) => void
}

export default function WorldEntitySheet({ entity, onSave, onDelete }: WorldEntitySheetProps) {
  const [formData, setFormData] = useState(entity)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`http://localhost:3000/world/${entity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error('Failed to save entity')
      const updated = await response.json()
      onSave?.(updated)
      toast.success('Đã lưu thay đổi')
    } catch (error) {
      toast.error('Lỗi khi lưu')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa thực thể này?')) return
    setIsDeleting(true)
    try {
      const response = await fetch(`http://localhost:3000/world/${entity.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete entity')
      onDelete?.(entity.id)
      toast.success('Đã xóa')
    } catch (error) {
      toast.error('Lỗi khi xóa')
    } finally {
      setIsDeleting(false)
    }
  }

  const addTag = () => {
    if (tagInput && !formData.tags?.includes(tagInput)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput] })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tag) || [] })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Tên gọi</Label>
        <Input
          id="name"
          className="bg-[#161616] border-[#262626]"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả ngắn</Label>
        <Textarea
          id="description"
          rows={3}
          className="bg-[#161616] border-[#262626] italic font-serif"
          placeholder="Mô tả tóm tắt..."
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Chi tiết / Lore</Label>
        <Textarea
          id="content"
          rows={8}
          className="bg-[#161616] border-[#262626] font-serif leading-relaxed"
          placeholder="Ghi chú chi tiết về thực thể này..."
          value={formData.content || ''}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <Label>Thẻ (Tags)</Label>
        <div className="flex gap-2">
          <Input 
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="bg-[#161616] border-[#262626]"
            placeholder="Thêm thẻ..."
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
          />
          <Button type="button" variant="secondary" onClick={addTag} className="bg-[#262626]">Thêm</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags?.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-[#262626] rounded text-[10px] uppercase tracking-widest font-bold text-[#888]">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-white">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-[#262626]">
        <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Xóa
        </Button>
        <Button className="bg-white text-black hover:bg-white/90 font-bold px-8" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Lưu thay đổi
        </Button>
      </div>
    </div>
  )
}
