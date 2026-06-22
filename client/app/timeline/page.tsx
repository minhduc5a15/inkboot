import { Construction } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TimelinePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-100">
      <Construction className="w-24 h-24 text-zinc-800 mb-6" />
      <h1 className="text-3xl font-serif italic mb-2">Timeline Hub</h1>
      <p className="text-zinc-500 mb-8 max-w-md text-center">
        Global Timeline Management is currently under construction.
      </p>
      <Link href="/">
        <Button
          variant="outline"
          className="border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
        >
          Return to Library
        </Button>
      </Link>
    </div>
  );
}
