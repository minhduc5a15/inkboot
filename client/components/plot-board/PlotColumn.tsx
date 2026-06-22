import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PlotCard, PlotCardData } from './PlotCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlotColumnProps {
  id: string;
  title: string;
  subtitle: string;
  cards: PlotCardData[];
  onCardClick: (card: PlotCardData) => void;
  onAddCard: (act: string) => void;
}

export const PlotColumn: React.FC<PlotColumnProps> = ({
  id,
  title,
  subtitle,
  cards,
  onCardClick,
  onAddCard,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      act: id,
    },
  });

  return (
    <div className="flex flex-col flex-1 min-w-[280px] bg-zinc-950/50 border border-zinc-800 rounded-lg overflow-hidden h-full">
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-zinc-100">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            onClick={() => onAddCard(id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
          {subtitle}
        </p>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-2 overflow-y-auto transition-colors ${isOver ? 'bg-zinc-900/30' : ''}`}
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2 min-h-[100px]">
            {cards.map((card) => (
              <PlotCard key={card.id} card={card} onClick={onCardClick} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};
