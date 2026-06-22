'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  History,
  Trash2,
  ArrowLeft,
  GripVertical,
  Edit2,
} from 'lucide-react';
import Link from 'next/link';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

import { TimelineEvent } from '@/types';

const COLUMNS = [
  { id: 'act_1', title: 'Hồi 1: Mở Đầu' },
  { id: 'act_2_part_1', title: 'Hồi 2 (P1): Thử Thách' },
  { id: 'act_2_part_2', title: 'Hồi 2 (P2): Khủng Hoảng' },
  { id: 'act_3', title: 'Hồi 3: Giải Quyết' },
] as const;

const EVENT_TYPES = [
  { id: 'event', label: 'Sự kiện', color: 'border-zinc-800' },
  {
    id: 'climax',
    label: 'Cao trào',
    color: 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
  },
  {
    id: 'twist',
    label: 'Nút thắt',
    color: 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
  },
  {
    id: 'resolution',
    label: 'Mở nút',
    color: 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
  },
] as const;

function SortableEventCard({
  event,
  onDelete,
  onEdit,
}: {
  event: TimelineEvent;
  onDelete: (id: string) => void;
  onEdit: (event: TimelineEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: event.id,
    data: {
      type: 'Event',
      event,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const typeConfig =
    EVENT_TYPES.find((t) => t.id === event.type) || EVENT_TYPES[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-zinc-900 border ${typeConfig.color} rounded-lg p-4 transition-all duration-300 hover:border-zinc-600 ${isDragging ? 'opacity-50 scale-95 z-50' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div
          {...attributes}
          {...listeners}
          className="p-1 -ml-1 cursor-grab active:cursor-grabbing text-zinc-700 hover:text-zinc-500 transition-colors"
        >
          <GripVertical size={14} />
        </div>
        {event.datePoint && (
          <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700">
            {event.datePoint}
          </span>
        )}
      </div>

      <h4 className="font-serif italic text-white text-lg mb-2 leading-tight">
        {event.title}
      </h4>
      <p className="text-xs text-zinc-500 line-clamp-3 font-serif italic mb-4">
        {event.content}
      </p>

      <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
        <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-zinc-600">
          {typeConfig.label}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-600 hover:text-white"
            onClick={() => onEdit(event)}
          >
            <Edit2 size={12} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-600 hover:text-red-400 hover:bg-red-400/10"
            onClick={() => onDelete(event.id)}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PlotTrackerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: novelId } = use(params);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    datePoint: '',
    type: 'event' as TimelineEvent['type'],
    arc: 'act_1' as TimelineEvent['arc'],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/novels/${novelId}/timeline`
      );
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải dữ liệu cốt truyện');
    }
  }, [novelId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
  }, [fetchEvents]);

  const handleOpenModal = (event?: TimelineEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        content: event.content || '',
        datePoint: event.datePoint || '',
        type: event.type,
        arc: event.arc,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        content: '',
        datePoint: '',
        type: 'event',
        arc: 'act_1',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingEvent
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/timeline/${editingEvent.id}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/timeline`;

    const method = editingEvent ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, novelId }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        toast.success(
          editingEvent ? 'Đã cập nhật sự kiện' : 'Đã thêm sự kiện mới'
        );
        fetchEvents();
      }
    } catch (error) {
      console.error(error);
      toast.error('Thao tác thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa sự kiện này?')) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/timeline/${id}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        toast.success('Đã xóa sự kiện');
        fetchEvents();
      }
    } catch (error) {
      console.error(error);
      toast.error('Không thể xóa');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeEvent = events.find((e) => e.id === activeId);
    const overEvent = events.find((e) => e.id === overId);

    // Handle dropping over a column or another card
    const isOverAColumn = COLUMNS.some((col) => col.id === overId);

    if (activeEvent) {
      let newArc = activeEvent.arc;

      if (isOverAColumn) {
        newArc = overId as TimelineEvent['arc'];
      } else if (overEvent) {
        newArc = overEvent.arc;
      }

      if (newArc !== activeEvent.arc) {
        setEvents((prev) => {
          const activeIndex = prev.findIndex((e) => e.id === activeId);
          const newEvents = [...prev];
          newEvents[activeIndex] = { ...activeEvent, arc: newArc };

          // Reorder logic if dropping over another card in the same/different column
          if (!isOverAColumn && overEvent) {
            const overIndex = prev.findIndex((e) => e.id === overId);
            return arrayMove(newEvents, activeIndex, overIndex);
          }

          return newEvents;
        });
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeEvent = events.find((e) => e.id === active.id);
    if (!activeEvent) return;

    // Finalize the update to the server
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/timeline/${activeEvent.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ arc: activeEvent.arc }),
        }
      );
    } catch (error) {
      console.error('Failed to sync drag end:', error);
      fetchEvents(); // Revert on failure
    }
  };

  const activeEvent = activeId ? events.find((e) => e.id === activeId) : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#d4d4d4]">
      <div className="max-w-[1600px] mx-auto p-8 space-y-12">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-zinc-800 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Link href={`/novels/${novelId}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </Button>
              </Link>
              <div className="flex items-center gap-3 text-zinc-500">
                <History size={16} />
                <span className="text-[10px] uppercase tracking-[0.4em] font-semibold">
                  Structure
                </span>
              </div>
            </div>
            <h1 className="text-5xl font-serif italic text-white tracking-tight opacity-90">
              Plot Tracker
            </h1>
          </div>

          <Button
            onClick={() => handleOpenModal()}
            className="bg-zinc-800/50 hover:bg-zinc-700/50 text-white border border-zinc-700/50 rounded h-11 px-8 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
          >
            <Plus size={16} className="mr-2" /> New Plot Point
          </Button>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex flex-col gap-4 min-h-[500px]">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
                    {col.title}
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-700">
                    {events.filter((e) => e.arc === col.id).length}
                  </span>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col gap-3 h-full min-h-[600px]">
                  <SortableContext
                    id={col.id}
                    items={events
                      .filter((e) => e.arc === col.id)
                      .map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {events
                      .filter((e) => e.arc === col.id)
                      .map((event) => (
                        <SortableEventCard
                          key={event.id}
                          event={event}
                          onDelete={handleDelete}
                          onEdit={handleOpenModal}
                        />
                      ))}
                  </SortableContext>

                  {events.filter((e) => e.arc === col.id).length === 0 && (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-900 rounded-lg">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-700 font-bold">
                        Empty Act
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DragOverlay
            dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}
          >
            {activeEvent ? (
              <div
                className={`bg-zinc-900 border ${EVENT_TYPES.find((t) => t.id === activeEvent.type)?.color} rounded-lg p-4 shadow-2xl scale-105 opacity-90`}
              >
                <div className="flex justify-between items-start mb-2">
                  <GripVertical size={14} className="text-zinc-500" />
                  {activeEvent.datePoint && (
                    <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">
                      {activeEvent.datePoint}
                    </span>
                  )}
                </div>
                <h4 className="font-serif italic text-white text-lg mb-2">
                  {activeEvent.title}
                </h4>
                <p className="text-xs text-zinc-500 line-clamp-2 font-serif italic">
                  {activeEvent.content}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-[#d4d4d4] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif italic text-white opacity-90">
                {editingEvent ? 'Edit Plot Point' : 'Create Plot Point'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    Loại sự kiện
                  </Label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as TimelineEvent['type'],
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md h-10 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all appearance-none cursor-pointer"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    Giai đoạn
                  </Label>
                  <select
                    value={formData.arc}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        arc: e.target.value as TimelineEvent['arc'],
                      })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md h-10 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all appearance-none cursor-pointer"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  Mốc thời gian
                </Label>
                <Input
                  placeholder="VD: Mùa Xuân, Năm 120"
                  value={formData.datePoint}
                  onChange={(e) =>
                    setFormData({ ...formData, datePoint: e.target.value })
                  }
                  className="bg-zinc-900 border-zinc-800 h-11 text-sm focus:border-zinc-600 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  Tiêu đề
                </Label>
                <Input
                  placeholder="Tiêu đề sự kiện..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="bg-zinc-900 border-zinc-800 h-11 text-sm focus:border-zinc-600 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                  Mô tả chi tiết
                </Label>
                <Textarea
                  placeholder="Mô tả điều gì đã xảy ra..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="bg-zinc-900 border-zinc-800 min-h-[120px] text-sm focus:border-zinc-600 transition-all resize-none"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-white text-black hover:bg-white/90 font-bold uppercase tracking-widest text-[10px] h-11"
                >
                  {editingEvent ? 'Save Changes' : 'Create Plot Point'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
