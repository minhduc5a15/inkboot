'use client'

import Link from 'next/link'
import { Book, Home, FolderKanban, PlusCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Dự án của tôi', href: '/', icon: FolderKanban },
  ]

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 text-white mb-8">
          <Book className="h-8 w-8 text-primary" />
          <span className="text-xl font-serif font-bold tracking-tight">Inkboot</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-slate-900 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800 text-slate-500 text-xs">
        © 2026 Inkboot Studio
      </div>
    </aside>
  )
}
