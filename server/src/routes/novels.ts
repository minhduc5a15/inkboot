import { Elysia, t } from 'elysia'
import { db } from '../db'
import { novels, chapters, characters } from '../schema'
import { eq, desc, asc } from 'drizzle-orm'

export const novelRoutes = new Elysia({ prefix: '/novels' })
    .get('/', async () => {
        try {
            return await db.select().from(novels).orderBy(desc(novels.createdAt))
        } catch (error) {
            return { error: 'Failed to fetch novels', details: error }
        }
    })
    .post('/', async ({ body, set }) => {
        try {
            const [novel] = await db.insert(novels).values(body).returning()
            set.status = 201
            return novel
        } catch (error) {
            set.status = 500
            return { error: 'Failed to create novel', details: error }
        }
    }, {
        body: t.Object({
            title: t.String(),
            description: t.Optional(t.String())
        })
    })
    .get('/:id', async ({ params: { id }, set }) => {
        try {
            const novel = await db.select().from(novels).where(eq(novels.id, id)).limit(1)
            
            if (novel.length === 0) {
                set.status = 404
                return { error: 'Novel not found' }
            }

            const novelChapters = await db.select().from(chapters)
                .where(eq(chapters.novelId, id))
                .orderBy(asc(chapters.order))

            return {
                ...novel[0],
                chapters: novelChapters
            }
        } catch (error) {
            set.status = 500
            return { error: 'Internal server error', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })
    .delete('/:id', async ({ params: { id }, set }) => {
        try {
            const [deletedNovel] = await db.delete(novels)
                .where(eq(novels.id, id))
                .returning()

            if (!deletedNovel) {
                set.status = 404
                return { error: 'Novel not found' }
            }

            return { message: 'Novel deleted successfully' }
        } catch (error) {
            set.status = 500
            return { error: 'Failed to delete novel', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })
    .get('/:id/characters', async ({ params: { id } }) => {
        try {
            return await db.select().from(characters)
                .where(eq(characters.novelId, id))
                .orderBy(asc(characters.name))
        } catch (error) {
            return { error: 'Failed to fetch characters', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })
    .get('/:id/timeline', async ({ params: { id } }) => {
        try {
            return await db.select().from(timelineEvents)
                .where(eq(timelineEvents.novelId, id))
                .orderBy(asc(timelineEvents.createdAt)) // Simplified, real apps might sort by datePoint
        } catch (error) {
            return { error: 'Failed to fetch timeline', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })
    .get('/:id/export/:format', async ({ params: { id, format }, set }) => {
        try {
            const novel = await db.select().from(novels).where(eq(novels.id, id)).limit(1)
            if (novel.length === 0) {
                set.status = 404
                return { error: 'Novel not found' }
            }

            const novelChapters = await db.select().from(chapters)
                .where(eq(chapters.novelId, id))
                .orderBy(asc(chapters.order))

            let fullContent = `# ${novel[0].title}\n\n${novel[0].description || ''}\n\n---\n\n`

            novelChapters.forEach(chapter => {
                fullContent += `## ${chapter.title}\n\n`
                
                // Simple Tiptap JSON to Text/Markdown converter
                if (chapter.content) {
                    try {
                        const contentObj = JSON.parse(chapter.content)
                        const extractText = (node: any): string => {
                            if (node.type === 'text') return node.text
                            if (node.content) return node.content.map(extractText).join('')
                            if (node.type === 'paragraph') return extractText(node) + '\n\n'
                            return ''
                        }
                        
                        if (contentObj.content) {
                            fullContent += contentObj.content.map((n: any) => {
                                if (n.type === 'paragraph') {
                                    return (n.content || []).map((t: any) => t.text || '').join('') + '\n\n'
                                }
                                if (n.type === 'heading') {
                                    const level = n.attrs?.level || 1
                                    const hashes = '#'.repeat(level + 2)
                                    return `${hashes} ${(n.content || []).map((t: any) => t.text || '').join('')}\n\n`
                                }
                                return ''
                            }).join('')
                        }
                    } catch (e) {
                        fullContent += '[Lỗi khi xử lý nội dung chương]\n\n'
                    }
                }
                fullContent += '\n---\n\n'
            })

            const filename = `${novel[0].title.replace(/\s+/g, '_')}.${format}`
            set.headers['Content-Disposition'] = `attachment; filename="${filename}"`
            
            if (format === 'txt') {
                // Strip markdown-like syntax for plain text
                return fullContent.replace(/#+\s/g, '').replace(/---\n/g, '')
            }

            return fullContent
        } catch (error) {
            set.status = 500
            return { error: 'Export failed', details: error }
        }
    }, {
        params: t.Object({
            id: t.String(),
            format: t.Union([t.Literal('markdown'), t.Literal('txt')])
        })
    })
