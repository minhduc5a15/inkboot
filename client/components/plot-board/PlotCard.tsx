import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface LinkedEntity {
  id: string;
  name: string;
  type: string;
}

export interface PlotCardData {
  id: string;
  title: string;
  description: string | null;
  act: string;
  position: number;
  foreshadowingNotes: string | null;
  linkedEntities?: LinkedEntity[];
}

interface PlotCardProps {
  card: PlotCardData;
  onClick: (card: PlotCardData) => void;
}

export const PlotCard: React.FC<PlotCardProps> = ({ card, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'PlotCard', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="pb-2"
    >
      <Card
        className={`bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-grab active:cursor-grabbing transition-colors ${isDragging ? 'ring-2 ring-blue-500/50 shadow-lg' : ''}`}
        onClick={() => {
          // Prevent drag from triggering click if it was a drag
          if (
            transform &&
            (Math.abs(transform.x) > 5 || Math.abs(transform.y) > 5)
          )
            return;
          onClick(card);
        }}
      >
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm font-medium text-zinc-100 leading-tight">
            {card.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          {card.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
              {card.description}
            </p>
          )}
          {card.linkedEntities && card.linkedEntities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {card.linkedEntities.map((entity) => (
                <span
                  key={entity.id}
                  className="px-1.5 py-0.5 rounded-sm bg-zinc-800/50 text-zinc-300 text-[10px] border border-zinc-700/50"
                  title={entity.name}
                >
                  {entity.name}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
