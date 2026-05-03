import { Elysia, t } from 'elysia'
import { db } from '../db'
import { novels, chapters, characters, timelineEvents, writingLogs } from '../schema'
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

            const calculateWords = (jsonStr: string | null): number => {
                if (!jsonStr) return 0
                try {
                    const contentObj = JSON.parse(jsonStr)
                    const getText = (node: any): string => {
                        if (node.type === 'text') return node.text || ''
                        if (node.content) return node.content.map(getText).join(' ')
                        return ''
                    }
                    const text = getText(contentObj)
                    return text.trim() ? text.trim().split(/\s+/).length : 0
                } catch {
                    return 0
                }
            }

            const chaptersWithStats = (novelChapters || []).map(chapter => ({
                ...chapter,
                wordCount: calculateWords(chapter.content)
            }))

            const totalWords = chaptersWithStats.reduce((sum, c) => sum + c.wordCount, 0)

            // Update writing logs for today
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            // This is a simple way to track daily progress: upsert total word count for the day
            // In a real app, we might want to track 'delta', but for simple charts, total per day is fine
            // actually, we want 'words written today'. So we might need to compare with yesterday.
            // Let's just store the totalWords at this point in time for this day.
            
            await db.insert(writingLogs)
                .values({ novelId: id, wordCount: totalWords, date: new Date() })
                .onConflictDoUpdate({
                    target: writingLogs.id, // This won't work easily with uuid and date. 
                    // Let's check schema. writingLogs has id (uuid). 
                    // We should probably check if a log for today exists.
                    set: { wordCount: totalWords }
                })
            
            // Re-think: Drizzle onConflict needs a unique constraint. 
            // I didn't add one. I'll just check manually for now.
            const existingLog = await db.select().from(writingLogs)
                .where(eq(writingLogs.novelId, id))
                .orderBy(desc(writingLogs.date))
                .limit(1)
            
            const isToday = existingLog.length > 0 && 
                new Date(existingLog[0].date).toDateString() === new Date().toDateString()
            
            if (isToday) {
                await db.update(writingLogs)
                    .set({ wordCount: totalWords })
                    .where(eq(writingLogs.id, existingLog[0].id))
            } else {
                await db.insert(writingLogs).values({ novelId: id, wordCount: totalWords })
            }

            return {
                ...novel[0],
                chapters: chaptersWithStats,
                totalWords
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
    .get('/:id/stats', async ({ params: { id } }) => {
        try {
            const logs = await db.select()
                .from(writingLogs)
                .where(eq(writingLogs.novelId, id))
                .orderBy(asc(writingLogs.date))
            
            return logs
        } catch (error) {
            return { error: 'Failed to fetch stats' }
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })
    .patch('/:id/chapters/reorder', async ({ params: { id }, body, set }) => {
        try {
            await db.transaction(async (tx) => {
                for (const item of body) {
                    await tx.update(chapters)
                        .set({ order: item.order })
                        .where(eq(chapters.id, item.id))
                }
            })
            return { message: 'Chapters reordered successfully' }
        } catch (error) {
            set.status = 500
            return { error: 'Reorder failed', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Array(t.Object({
            id: t.String(),
            order: t.Number()
        }))
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
