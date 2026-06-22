'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Book,
  Trash2,
  ChevronRight,
  Library as LibraryIcon,
  Search,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';
import { PromptDialog } from '@/components/ui/prompt-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Novel {
  id: string;
  title: string;
  description: string | null;
  totalWords: number;
  updatedAt: string;
}

export default function Library() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingNovelId, setDeletingNovelId] = useState<string | null>(null);

  const fetchNovels = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:808'}/novels`
      );
      const data = await res.json();
      setNovels(data);
    } catch (error) {
      console.error('Failed to fetch novels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovels();
  }, []);

  const handleCreateNovel = async (title: string) => {
    setIsPromptOpen(false);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:808'}/novels`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description: 'A new story begins...' }),
        }
      );
      if (res.ok) fetchNovels();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteNovel = async () => {
    if (!deletingNovelId) return;
    setIsConfirmOpen(false);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:808'}/novels/${deletingNovelId}`,
        { method: 'DELETE' }
      );
      setDeletingNovelId(null);
      fetchNovels();
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingNovelId(id);
    setIsConfirmOpen(true);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-12 space-y-16">
        {/* Hero Section */}
        <div className="flex justify-between items-end border-b border-zinc-800 pb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-500">
              <LibraryIcon size={16} />
              <span className="text-[10px] uppercase tracking-[0.4em] font-semibold">
                Manuscripts
              </span>
            </div>
            <h1 className="text-6xl font-serif italic text-white tracking-tight opacity-90">
              Studio
            </h1>
          </div>

          <Button
            onClick={() => setIsPromptOpen(true)}
            className="bg-zinc-800/50 hover:bg-zinc-700/50 text-white border border-zinc-700/50 rounded h-11 px-8 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
          >
            <Plus size={16} className="mr-2" /> New Project
          </Button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-zinc-900 border border-zinc-800 rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.isArray(novels) &&
              novels.map((novel) => (
                <motion.div
                  key={novel.id}
                  whileHover={{ y: -2 }}
                  className="group relative bg-zinc-900 border border-zinc-800 rounded p-8 flex flex-col justify-between hover:border-zinc-600 transition-all duration-300"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-zinc-800 rounded text-zinc-400 group-hover:text-white transition-colors">
                        <FileText size={20} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          confirmDelete(novel.id);
                        }}
                        className="text-zinc-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-serif italic text-white opacity-90 group-hover:underline">
                        <Link href={`/novels/${novel.id}`}>{novel.title}</Link>
                      </h2>
                      <p className="text-sm text-zinc-500 line-clamp-2 italic font-serif leading-relaxed">
                        {novel.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-600 font-bold">
                        Word Count
                      </span>
                      <span className="text-sm font-mono text-zinc-400">
                        {(novel.totalWords ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <Link href={`/novels/${novel.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest font-bold"
                      >
                        Open <ChevronRight size={14} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
          </div>
        )}

        {novels.length === 0 && !loading && (
          <div className="text-center py-32 space-y-6 border border-dashed border-zinc-800 rounded">
            <div className="p-6 bg-zinc-900 rounded w-fit mx-auto text-zinc-600">
              <Plus size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif italic text-zinc-400">
                No manuscripts found
              </h3>
              <p className="text-zinc-500 text-sm">
                Start your creative journey today.
              </p>
            </div>
            <Button
              onClick={() => setIsPromptOpen(true)}
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              Create First Story
            </Button>
          </div>
        )}
      </div>

      <PromptDialog
        isOpen={isPromptOpen}
        title="Create New Project"
        placeholder="e.g. The Obsidian Crown"
        onConfirm={handleCreateNovel}
        onCancel={() => setIsPromptOpen(false)}
        confirmText="Create"
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Project"
        message="Are you sure you want to delete this manuscript? All chapters, plot cards, and characters will be permanently lost."
        onConfirm={handleDeleteNovel}
        onCancel={() => setIsConfirmOpen(false)}
        isDestructive={true}
      />
    </div>
  );
}
