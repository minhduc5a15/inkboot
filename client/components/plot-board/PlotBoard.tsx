'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { PlotColumn } from './PlotColumn';
import { PlotCard, PlotCardData } from './PlotCard';
import { PlotCardDialog } from './PlotCardDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';

interface PlotBoardProps {
  novelId: string;
}

const ACTS = [
  { id: 'act1', title: 'Act 1: Setup', subtitle: 'Setup & Inciting Incident' },
  {
    id: 'act2a',
    title: 'Act 2A: Rising Action',
    subtitle: 'First obstacles & Subplots',
  },
  {
    id: 'act2b',
    title: 'Act 2B: Midpoint to Crisis',
    subtitle: 'Midpoint shift & Plot Point 2',
  },
  {
    id: 'act3',
    title: 'Act 3: Resolution',
    subtitle: 'Climax & Final Resolution',
  },
];

export const PlotBoard: React.FC<PlotBoardProps> = ({ novelId }) => {
  const [cards, setCards] = useState<PlotCardData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PlotCardData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCards = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/novels/${novelId}/plot-board`
      );
      if (!res.ok) throw new Error('Failed to fetch cards');
      const data = await res.json();
      setCards(data);
    } catch (error) {
      toast.error('Could not load plot board');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [novelId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Determine the source and destination containers (Acts)
    const activeCard = cards.find((c) => c.id === activeId);
    if (!activeCard) return;

    let overAct = '';
    let overIndex = -1;

    // Check if over a column or a card
    if (over.data.current?.type === 'Column') {
      overAct = over.data.current.act;
      // Dropping directly on column
      const actCards = cards
        .filter((c) => c.act === overAct)
        .sort((a, b) => a.position - b.position);
      overIndex = actCards.length;
    } else {
      const overCard = cards.find((c) => c.id === overId);
      if (overCard) {
        overAct = overCard.act;
        const actCards = cards
          .filter((c) => c.act === overAct)
          .sort((a, b) => a.position - b.position);
        overIndex = actCards.findIndex((c) => c.id === overId);

        // If dropping below the card
        if (event.delta.y > 0) {
          overIndex += 1;
        }
      }
    }

    if (!overAct) return;

    const sourceAct = activeCard.act;
    const activeIndexInSource = cards
      .filter((c) => c.act === sourceAct)
      .sort((a, b) => a.position - b.position)
      .findIndex((c) => c.id === activeId);

    let newCards = [...cards];

    // Optimistic UI update
    if (sourceAct === overAct) {
      if (activeIndexInSource !== overIndex) {
        const actCards = newCards
          .filter((c) => c.act === overAct)
          .sort((a, b) => a.position - b.position);
        const reordered = arrayMove(actCards, activeIndexInSource, overIndex);

        // Re-calculate positions to ensure they are strictly increasing
        reordered.forEach((c, idx) => {
          c.position = (idx + 1) * 1024;
        });

        // Update main state
        newCards = newCards.map((c) => {
          const updated = reordered.find((rc) => rc.id === c.id);
          return updated ? { ...c, position: updated.position } : c;
        });
        setCards(newCards);
        await syncReorder(newCards.filter((c) => c.act === overAct));
      }
    } else {
      // Moving between columns
      const sourceCards = newCards
        .filter((c) => c.act === sourceAct)
        .sort((a, b) => a.position - b.position);
      const destCards = newCards
        .filter((c) => c.act === overAct)
        .sort((a, b) => a.position - b.position);

      const [movedCard] = sourceCards.splice(activeIndexInSource, 1);
      movedCard.act = overAct;

      destCards.splice(overIndex, 0, movedCard);

      // Re-calculate positions for destination
      destCards.forEach((c, idx) => {
        c.position = (idx + 1) * 1024;
      });

      // Update main state
      newCards = newCards.map((c) => {
        if (c.id === movedCard.id) return movedCard;
        const updatedDest = destCards.find((rc) => rc.id === c.id);
        if (updatedDest) return updatedDest;
        return c;
      });
      setCards(newCards);
      await syncReorder(destCards); // We only need to sync the destination column since source order doesn't functionally change
    }
  };

  const syncReorder = async (updatedCards: PlotCardData[]) => {
    try {
      const payload = updatedCards.map((c) => ({
        id: c.id,
        act: c.act,
        position: c.position,
      }));
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/novels/${novelId}/plot-board/cards/reorder`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error('Reorder failed');
    } catch (error) {
      toast.error('Failed to save order');
      fetchCards(); // Revert on fail
    }
  };

  const handleAddCard = (act: string) => {
    const tempCard: PlotCardData = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      act,
      position: 0,
      foreshadowingNotes: '',
    };
    setEditingCard(tempCard);
    setIsCreating(true);
    setDialogOpen(true);
  };

  const handleCardClick = (card: PlotCardData) => {
    setEditingCard(card);
    setIsCreating(false);
    setDialogOpen(true);
  };

  const handleSaveCard = async (id: string, updates: Partial<PlotCardData>) => {
    setDialogOpen(false);
    try {
      if (isCreating) {
        // Create
        const payload = { ...updates, act: editingCard?.act || updates.act };
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/novels/${novelId}/plot-board/cards`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) throw new Error('Create failed');
        const newCard = await res.json();
        setCards([...cards, newCard]);
        toast.success('Event created');
      } else {
        // Update
        // Optimistic update
        setCards(cards.map((c) => (c.id === id ? { ...c, ...updates } : c)));

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/novels/${novelId}/plot-board/cards/${id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        );
        if (!res.ok) throw new Error('Update failed');
        toast.success('Event updated');
      }
    } catch (error) {
      toast.error('Failed to save event');
      fetchCards();
    }
  };

  const confirmDeleteCard = (id: string) => {
    setDeletingCardId(id);
    setIsConfirmOpen(true);
    setDialogOpen(false);
  };

  const handleDeleteCard = async () => {
    if (!deletingCardId) return;
    setIsConfirmOpen(false);

    // Optimistic delete
    setCards(cards.filter((c) => c.id !== deletingCardId));

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/novels/${novelId}/plot-board/cards/${deletingCardId}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Event deleted');
      setDeletingCardId(null);
    } catch (error) {
      toast.error('Failed to delete event');
      fetchCards();
    }
  };

  const activeCardData = activeId ? cards.find((c) => c.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Loading Plot Board...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col pt-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4 h-full">
          {ACTS.map((act) => {
            const columnCards = cards
              .filter((c) => c.act === act.id)
              .sort((a, b) => a.position - b.position);

            return (
              <PlotColumn
                key={act.id}
                id={act.id}
                title={act.title}
                subtitle={act.subtitle}
                cards={columnCards}
                onCardClick={handleCardClick}
                onAddCard={handleAddCard}
              />
            );
          })}
        </div>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.5' } },
            }),
          }}
        >
          {activeCardData ? (
            <div className="w-[280px]">
              <PlotCard card={activeCardData} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <PlotCardDialog
        card={editingCard}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveCard}
        onDelete={confirmDeleteCard}
        isCreating={isCreating}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Plot Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={handleDeleteCard}
        onCancel={() => setIsConfirmOpen(false)}
        isDestructive={true}
      />
    </div>
  );
};
