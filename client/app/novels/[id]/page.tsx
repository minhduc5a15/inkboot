'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  Trash2,
  Download,
  Users,
  Calendar,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PromptDialog } from '@/components/ui/prompt-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Chapter {
  id: string;
  title: string;
  order: number;
  wordCount: number;
}

interface SortableChapterProps {
  chapter: Chapter;
  novelId: string;
  onDelete: (id: string) => void;
}

function SortableChapter({ chapter, novelId, onDelete }: SortableChapterProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-all duration-300 ${isDragging ? 'opacity-50 scale-[0.98] shadow-2xl' : ''}`}
    >
      <div className="flex items-center gap-4 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="p-2 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <GripVertical size={16} />
        </div>
        <Link
          href={`/edit/${chapter.id}`}
          className="flex-1 flex items-center gap-3"
        >
          <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-white transition-colors">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="font-serif italic text-lg text-white group-hover:underline">
              {chapter.title}
            </h3>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
              CHAPTER {chapter.order} • {chapter.wordCount} WORDS
            </span>
          </div>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-600 hover:text-red-400 hover:bg-red-400/10"
          onClick={() => onDelete(chapter.id)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}

export default function NovelHub({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [novel, setNovel] = useState<Record<string, unknown> | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Array<Record<string, unknown>>>([]);

  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchData = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/novels/${id}`
      );
      if (!res.ok) throw new Error('Failed to fetch novel');

      const data = await res.json();
      setNovel(data);
      setChapters(
        (data.chapters || []).sort(
          (a: { order: number }, b: { order: number }) => a.order - b.order
        )
      );

      const statsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/novels/${id}/stats`
      );
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchData();
  });

  const handleAddChapter = async (title: string) => {
    setIsPromptOpen(false);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/chapters`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novelId: id,
            title,
            order: chapters.length + 1,
            content: '{}',
          }),
        }
      );
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteChapter = async () => {
    if (!deletingChapterId) return;
    setIsConfirmOpen(false);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/chapters/${deletingChapterId}`,
        { method: 'DELETE' }
      );
      setDeletingChapterId(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = (chapterId: string) => {
    setDeletingChapterId(chapterId);
    setIsConfirmOpen(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex((c) => c.id === active.id);
      const newIndex = chapters.findIndex((c) => c.id === over.id);
      const newChapters = arrayMove(chapters, oldIndex, newIndex);

      setChapters(newChapters);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/novels/${id}/chapters/reorder`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
              newChapters.map((c, i) => ({ id: c.id, order: i + 1 }))
            ),
          }
        );

        if (res.ok) {
          const updatedChapters = await res.json();
          setChapters(updatedChapters);
        } else {
          throw new Error('Failed to reorder');
        }
      } catch (error) {
        console.error('Failed to reorder:', error);
        fetchData();
      }
    }
  };

  const exportNovel = async (format: 'markdown' | 'text') => {
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/novels/${id}/export?format=${format}`,
      '_blank'
    );
  };

  if (loading) return null;
  if (!novel)
    return (
      <div className="p-12 text-center text-zinc-500">Novel not found.</div>
    );

  const targetWords = 50000;
  const totalWords = novel.totalWords ?? 0;
  const progress = Math.min((totalWords / targetWords) * 100, 100);

  // Calculate Daily Words for chart
  const getDailyStats = () => {
    if (!stats || stats.length === 0) return { dailyWords: [], avgWords: 0 };

    // Sort stats by date ascending to calculate diffs correctly
    const sorted = [...stats].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const dailyDiffs = sorted
      .map((log, i) => {
        const wordsWritten =
          i === 0
            ? log.wordCount
            : Math.max(0, log.wordCount - sorted[i - 1].wordCount);
        return { date: log.date, words: wordsWritten };
      })
      .slice(-7);

    const avgWords =
      dailyDiffs.reduce((a, b) => a + b.words, 0) / (dailyDiffs.length || 1);

    return { dailyWords: dailyDiffs, avgWords };
  };

  const { dailyWords, avgWords } = getDailyStats();
  const streak = novel.streak || 0;
  const daysRemaining =
    avgWords > 0 ? Math.ceil((targetWords - totalWords) / avgWords) : Infinity;
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const estCompletion =
    daysRemaining === Infinity
      ? 'N/A'
      : new Date(
          now + daysRemaining * 24 * 60 * 60 * 1000
        ).toLocaleDateString();

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-12 space-y-16">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <span className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
              PROJECT HUB
            </span>
            <h1 className="text-5xl font-serif italic text-white">
              {novel.title}
            </h1>
            <p className="text-zinc-400 font-serif italic text-lg">
              {novel.description}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={`/novels/${id}/plot-board`}>
              <Button
                variant="outline"
                className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-6"
              >
                <GripVertical size={16} className="mr-2" /> PLOT BOARD
              </Button>
            </Link>
            <Link href={`/novels/${id}/wiki`}>
              <Button
                variant="outline"
                className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-6"
              >
                <Users size={16} className="mr-2" /> WIKI
              </Button>
            </Link>
            <Link href={`/novels/${id}/timeline`}>
              <Button
                variant="outline"
                className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-6"
              >
                <Calendar size={16} className="mr-2" /> TIMELINE
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {[
            { label: 'TOTAL WORDS', value: totalWords.toLocaleString() },
            { label: 'WRITING STREAK', value: `${streak} DAYS` },
            { label: 'AVG. PER DAY', value: Math.round(avgWords) },
            { label: 'EST. COMPLETION', value: estCompletion },
          ].map((stat, i) => (
            <div key={i} className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold">
                {stat.label}
              </span>
              <p className="text-3xl font-serif italic text-white opacity-90">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold">
                  MANUSCRIPT PROGRESS
                </span>
                <span className="text-2xl font-serif italic text-white opacity-90">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-0.5 bg-zinc-800" />
              <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] text-center font-bold">
                {totalWords.toLocaleString()} / {targetWords.toLocaleString()}{' '}
                WORDS
              </p>
            </div>
          </div>

          {/* Simple CSS Chart */}
          <div className="space-y-6">
            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold">
              ACTIVITY (LAST 7 DAYS)
            </span>
            <div className="h-24 flex items-end gap-2">
              {dailyWords.map((day, i) => {
                const height = Math.max(
                  10,
                  Math.min(
                    100,
                    (day.words /
                      (Math.max(...dailyWords.map((d) => d.words)) || 1)) *
                      100
                  )
                );
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2 group"
                  >
                    <div
                      className="w-full bg-zinc-800 group-hover:bg-white/20 transition-all duration-500 rounded-t-sm relative"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.words}
                      </div>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-bold">
                      {new Date(day.date)
                        .toLocaleDateString('en', { weekday: 'short' })
                        .toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="space-y-8">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <h2 className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
              CHAPTER LIST
            </h2>
            <div className="flex gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-500 hover:text-white uppercase tracking-widest text-[10px] font-bold"
                  >
                    <Download size={14} className="mr-2" /> EXPORT
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                  <DropdownMenuItem
                    onClick={() => exportNovel('markdown')}
                    className="hover:bg-zinc-800"
                  >
                    MARKDOWN (.MD)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => exportNovel('text')}
                    className="hover:bg-zinc-800"
                  >
                    TEXT (.TXT)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => setIsPromptOpen(true)}
                className="bg-white text-black hover:bg-white/90 rounded-full px-6 text-[10px] font-bold uppercase tracking-widest shadow-xl"
              >
                <Plus size={14} className="mr-2" /> NEW CHAPTER
              </Button>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={chapters.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <SortableChapter
                    key={chapter.id}
                    chapter={chapter}
                    novelId={id}
                    onDelete={confirmDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <PromptDialog
        isOpen={isPromptOpen}
        title="Create New Chapter"
        placeholder="e.g. Chapter 1: The Beginning"
        onConfirm={handleAddChapter}
        onCancel={() => setIsPromptOpen(false)}
        confirmText="Create"
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Chapter"
        message="Are you sure you want to delete this chapter? This action cannot be undone."
        onConfirm={handleDeleteChapter}
        onCancel={() => setIsConfirmOpen(false)}
        isDestructive={true}
      />
    </div>
  );
}
