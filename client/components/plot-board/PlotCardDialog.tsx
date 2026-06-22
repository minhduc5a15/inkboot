import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlotCardData } from './PlotCard';

interface PlotCardDialogProps {
  card: PlotCardData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<PlotCardData>) => void;
  onDelete: (id: string) => void;
  isCreating?: boolean;
}

export const PlotCardDialog: React.FC<PlotCardDialogProps> = ({
  card,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isCreating = false,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [act, setAct] = useState('act1');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (card && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(card.title || '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription(card.description || '');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAct(card.act || 'act1');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes(card.foreshadowingNotes || '');
    } else if (isOpen && isCreating) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription('');
      // act is set by the parent usually when creating
    }
  }, [card, isOpen, isCreating]);

  const handleSave = () => {
    if (!title.trim()) return;

    if (isCreating && card) {
      // if creating, card might just be a template with an act
      onSave(card.id, { title, description, act, foreshadowingNotes: notes });
    } else if (card) {
      onSave(card.id, { title, description, act, foreshadowingNotes: notes });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? 'Create Plot Event' : 'Edit Plot Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-zinc-400 text-xs">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Call to Adventure"
              className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="act" className="text-zinc-400 text-xs">
              Act
            </Label>
            <select
              id="act"
              value={act}
              onChange={(e) => setAct(e.target.value)}
              className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-100"
            >
              <option value="act1">Act 1: Setup</option>
              <option value="act2a">Act 2A: Rising Action</option>
              <option value="act2b">Act 2B: Midpoint to Crisis</option>
              <option value="act3">Act 3: Resolution</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-zinc-400 text-xs">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happens in this event?"
              className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700 min-h-[100px] resize-none"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-zinc-400 text-xs">
              Foreshadowing Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any hints or foreshadowing to drop here?"
              className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700 min-h-[60px] resize-none"
            />
          </div>

          {/* Linked entities could be added here later with a combobox */}
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          {!isCreating && card ? (
            <Button
              variant="destructive"
              onClick={() => onDelete(card.id)}
              className="bg-red-900/50 text-red-200 hover:bg-red-900/80 hover:text-red-100"
            >
              Delete
            </Button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            >
              {isCreating ? 'Create' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
