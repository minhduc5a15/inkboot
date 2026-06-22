import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface PromptDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  isOpen,
  title,
  message,
  defaultValue = '',
  onConfirm,
  onCancel,
  confirmText = 'Submit',
  cancelText = 'Cancel',
  placeholder = '',
}) => {
  const [value, setValue] = useState(defaultValue);

  // Reset value when dialog opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onConfirm(value.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {message && (
              <DialogDescription className="text-zinc-400 pt-2">
                {message}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
              autoFocus
            />
          </div>

          <DialogFooter className="flex sm:justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="hover:bg-zinc-800 hover:text-zinc-100"
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              disabled={!value.trim()}
            >
              {confirmText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
