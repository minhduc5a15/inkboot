import React from 'react';
import { PlotBoard } from '@/components/plot-board/PlotBoard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function PlotBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/novels/${id}`}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5 rounded-md hover:bg-zinc-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">
              Plot Tracker
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Three-Act Structure
            </p>
          </div>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="flex-1 overflow-hidden p-4">
        <PlotBoard novelId={id} />
      </main>
    </div>
  );
}
