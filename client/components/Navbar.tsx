'use client';

import Link from 'next/link';
import { Book, Users, Calendar, Settings, Plus, Library } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useFocus } from '@/lib/focus-context';

const navItems = [
  { icon: Library, label: 'Thư viện', href: '/' },
  { icon: Book, label: 'Tiểu thuyết', href: '/novels' },
  { icon: Users, label: 'Nhân vật', href: '/wiki' },
  { icon: Calendar, label: 'Dòng thời gian', href: '/timeline' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isFocusMode } = useFocus();

  if (isFocusMode) return null;

  return (
    <aside className="h-full w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col flex-shrink-0 relative z-50 overflow-hidden">
      <div className="p-6 pb-2 flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
          Inkboot
        </h2>
        <button className="p-1 hover:bg-zinc-800/50 rounded text-zinc-400 transition-colors">
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                  isActive
                    ? 'text-white font-medium bg-zinc-800/50'
                    : 'text-white opacity-60 hover:opacity-100 hover:bg-zinc-900/50'
                }`}
              >
                <item.icon size={14} className="mr-3" />
                <span className="truncate flex-1 text-left">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-zinc-800 space-y-1">
          <h3 className="px-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-3">
            System
          </h3>
          <Link
            href="/settings"
            className="w-full flex items-center px-3 py-1.5 rounded-md text-[13px] text-white opacity-60 hover:opacity-100 hover:bg-zinc-900/50 transition-colors"
          >
            <Settings size={14} className="mr-3" />
            <span className="truncate flex-1 text-left">Cài đặt</span>
          </Link>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-900/50 hover:bg-zinc-800/50 text-zinc-400 hover:text-white border border-zinc-800/50 rounded transition-all">
          <Plus size={14} />
          <span className="text-[10px] uppercase tracking-[0.1em] font-bold">
            New Project
          </span>
        </button>
      </div>
    </aside>
  );
}
