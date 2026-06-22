import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-zinc-400 pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex sm:justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="hover:bg-zinc-800 hover:text-zinc-100"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={isDestructive ? 'destructive' : 'default'}
            className={
              isDestructive
                ? 'bg-red-900/80 hover:bg-red-900 text-red-100'
                : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
            }
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
