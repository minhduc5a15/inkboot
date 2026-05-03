import Editor from '@/components/Editor'
import { notFound } from 'next/navigation'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Users, Info } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

async function getChapter(id: string) {
  try {
    const res = await fetch(`http://localhost:3000/chapters/${id}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      if (res.status === 404) return null
      if (res.status === 500) {
        console.error('Server error while fetching chapter')
      }
      throw new Error(`Failed to fetch chapter: ${res.status}`)
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching chapter:', error)
    throw error
  }
}

async function getCharacters(novelId: string) {
  try {
    const res = await fetch(`http://localhost:3000/novels/${novelId}/characters`)
    if (!res.ok) return []
    return res.json()
  } catch (error) {
    console.error('Error fetching characters:', error)
    return []
  }
}

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const chapter = await getChapter(id)

  if (!chapter) {
    notFound()
  }

  const characters = await getCharacters(chapter.novelId)

  return (
    <main className="min-h-screen relative">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Editor 
          id={id} 
          novelId={chapter.novelId}
          initialContent={chapter.content} 
          title={chapter.title}
          order={chapter.order}
          characters={characters}
        />
      </div>
    </main>
  )
}
