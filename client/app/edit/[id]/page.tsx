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
    <main className="min-h-screen bg-[#fcfaf7] relative">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="mb-8 text-center relative">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            {chapter.title}
          </h1>
          <p className="text-muted-foreground italic">
            Chương {chapter.order}
          </p>

          {/* Character Quick Access */}
          <div className="absolute right-0 top-0">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full shadow-sm">
                  <Users className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Nhân vật tham chiếu
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full pr-4 mt-4">
                  <div className="space-y-6">
                    {characters.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Chưa có nhân vật nào được tạo.</p>
                    ) : (
                      characters.map((char: any) => (
                        <div key={char.id} className="space-y-2 pb-4 border-b last:border-0">
                          <h3 className="font-serif font-bold text-lg">{char.name} {char.age ? `(${char.age}t)` : ''}</h3>
                          {char.appearance && (
                            <div className="text-sm">
                              <span className="font-semibold text-primary">Ngoại hình:</span>
                              <p className="text-muted-foreground italic">{char.appearance}</p>
                            </div>
                          )}
                          {char.personality && (
                            <div className="text-sm">
                              <span className="font-semibold text-primary">Tính cách:</span>
                              <p className="text-muted-foreground italic">{char.personality}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </header>
        
        <Editor id={id} initialContent={chapter.content} />
      </div>
    </main>
  )
}
