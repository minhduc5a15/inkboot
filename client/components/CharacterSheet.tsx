'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Character } from '@/types';

interface CharacterSheetProps {
  character: Character;
  onSave?: (updated: Character) => void;
  onDelete?: (id: string) => void;
}

export default function CharacterSheet({
  character,
  onSave,
  onDelete,
}: CharacterSheetProps) {
  const [formData, setFormData] = useState(character);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/characters/${character.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
      if (!response.ok) throw new Error('Failed to save character');
      const updated = await response.json();
      onSave?.(updated);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsConfirmOpen(false);
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/characters/${character.id}`,
        {
          method: 'DELETE',
        }
      );
      if (!response.ok) throw new Error('Failed to delete character');
      onDelete?.(character.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Character Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-zinc-950 border-zinc-800"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={formData.age || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                age: parseInt(e.target.value) || null,
              })
            }
            className="bg-zinc-950 border-zinc-800"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="appearance">Appearance</Label>
        <Textarea
          id="appearance"
          rows={4}
          placeholder="Describe appearance..."
          value={formData.appearance || ''}
          onChange={(e) =>
            setFormData({ ...formData, appearance: e.target.value })
          }
          className="bg-zinc-950 border-zinc-800"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="personality">Personality</Label>
        <Textarea
          id="personality"
          rows={4}
          placeholder="Describe personality..."
          value={formData.personality || ''}
          onChange={(e) =>
            setFormData({ ...formData, personality: e.target.value })
          }
          className="bg-zinc-950 border-zinc-800"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="history">History / Background</Label>
        <Textarea
          id="history"
          rows={6}
          placeholder="Describe history..."
          value={formData.history || ''}
          onChange={(e) =>
            setFormData({ ...formData, history: e.target.value })
          }
          className="bg-zinc-950 border-zinc-800"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button
          variant="destructive"
          size="sm"
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
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
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
        title="Delete Character"
        message="Are you sure you want to delete this character? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
        isDestructive={true}
      />
    </div>
  );
}
