'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { WorldEntity } from '@/types';

interface WorldEntitySheetProps {
  entity: WorldEntity;
  onSave?: (updated: WorldEntity) => void;
  onDelete?: (id: string) => void;
}

export default function WorldEntitySheet({
  entity,
  onSave,
  onDelete,
}: WorldEntitySheetProps) {
  const [formData, setFormData] = useState(entity);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4000'}/world/${entity.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
      if (!response.ok) throw new Error('Failed to save entity');
      const updated = await response.json();
      onSave?.(updated);
      toast.success('Changes saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsConfirmOpen(false);
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4000'}/world/${entity.id}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Failed to delete entity');
      onDelete?.(entity.id);
      toast.success('Deleted successfully');
    } catch {
      toast.error('Lỗi khi xóa liên kết');
    } finally {
      setIsDeleting(false);
    }
  };

  const addTag = () => {
    if (tagInput && !formData.tags?.includes(tagInput)) {
      setFormData({ ...formData, tags: [...(formData.tags || []), tagInput] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          className="bg-zinc-950 border-zinc-800"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Short Description</Label>
        <Textarea
          id="description"
          rows={3}
          className="bg-zinc-950 border-zinc-800 italic font-serif"
          placeholder="Brief description..."
          value={formData.description || ''}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content / Lore</Label>
        <Textarea
          id="content"
          rows={8}
          className="bg-zinc-950 border-zinc-800 font-serif leading-relaxed"
          placeholder="Detailed notes about this entity..."
          value={formData.content || ''}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
        />
      </div>

      <div className="space-y-3">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="bg-zinc-950 border-zinc-800"
            placeholder="Add tag..."
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={addTag}
            className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags?.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded text-[10px] uppercase tracking-widest font-bold text-zinc-400"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Delete
        </Button>
        <Button
          className="bg-white text-black hover:bg-white/90 font-bold px-8"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Entity"
        message="Are you sure you want to delete this entity? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
        isDestructive={true}
      />
    </div>
  );
}
