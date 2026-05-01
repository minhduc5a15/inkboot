'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { useDebouncedCallback } from 'use-debounce'
import { useState, useEffect } from 'react'
import { Bold, Italic, Underline as UnderlineIcon, List, Save, CloudCheck, Loader2, Gauge, Clock, Target } from 'lucide-react'

interface EditorProps {
  id: string
  initialContent?: string
}

export default function Editor({ id, initialContent }: EditorProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [wordCount, setWordCount] = useState(0)
  const [sessionGoal] = useState(1000)

  const calculateStats = (editor: any) => {
    const text = editor.getText()
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    setWordCount(words)
  }

  const debouncedSave = useDebouncedCallback(async (content: string) => {
    setSaveStatus('saving')
    try {
      const response = await fetch(`http://localhost:3000/chapters/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) throw new Error('Failed to save')
      setSaveStatus('saved')
    } catch (error) {
      console.error('Auto-save error:', error)
      setSaveStatus('error')
    }
  }, 2000)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: 'Bắt đầu chương mới...',
      }),
    ],
    content: (() => {
      if (!initialContent) return ''
      try {
        return JSON.parse(initialContent)
      } catch (e) {
        console.error('Error parsing initial content:', e)
        return ''
      }
    })(),
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none max-w-none font-serif min-h-[80vh]',
      },
    },
    onUpdate: ({ editor }) => {
      calculateStats(editor)
      try {
        const json = JSON.stringify(editor.getJSON())
        debouncedSave(json)
      } catch (error) {
        console.error('Error serializing editor content:', error)
      }
    },
    onTransaction: ({ editor }) => {
      // Ensure stats are updated on initial load or non-content transactions
      calculateStats(editor)
    }
  })

  if (!editor) {
    return null
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto py-12 pb-32">
      {/* Stats Indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 text-sm text-muted-foreground bg-background/80 backdrop-blur px-6 py-2 rounded-full border shadow-sm z-50">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          <span>{wordCount} từ</span>
        </div>
        <div className="flex items-center gap-2 border-l pl-6">
          <Clock className="h-4 w-4 text-primary" />
          <span>~{Math.ceil(wordCount / 200)} phút đọc</span>
        </div>
        <div className="flex items-center gap-2 border-l pl-6">
          <Target className="h-4 w-4 text-primary" />
          <span>Mục tiêu: {Math.round(Math.min((wordCount / sessionGoal) * 100, 100))}%</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="fixed bottom-8 right-8 flex items-center gap-2 text-sm text-muted-foreground bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border shadow-sm z-50">
        {saveStatus === 'saving' && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang lưu...</span>
          </>
        )}
        {saveStatus === 'saved' && (
          <>
            <CloudCheck className="h-4 w-4 text-green-500" />
            <span>Đã lưu</span>
          </>
        )}
        {saveStatus === 'error' && (
          <span className="text-destructive">Lỗi lưu file</span>
        )}
      </div>

      {/* Toolbar */}
      <div className="sticky top-4 z-40 flex items-center gap-1 p-1 mb-8 bg-background/80 backdrop-blur border rounded-lg shadow-sm w-fit mx-auto">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('bold') ? 'bg-muted' : ''}`}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('italic') ? 'bg-muted' : ''}`}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('underline') ? 'bg-muted' : ''}`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
        >
          <List className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="bg-background rounded-xl p-8 shadow-sm border min-h-[85vh]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
