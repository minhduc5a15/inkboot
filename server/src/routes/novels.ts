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

            // Update writing logs for today - robust check
            const existingLogs = await db.select().from(writingLogs)
                .where(eq(writingLogs.novelId, id))
                .orderBy(desc(writingLogs.date))
                .limit(1)
            
            const lastLog = existingLogs[0]
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            const isToday = lastLog && 
                new Date(lastLog.date).setHours(0, 0, 0, 0) === today.getTime()
            
            if (isToday) {
                await db.update(writingLogs)
                    .set({ wordCount: totalWords })
                    .where(eq(writingLogs.id, lastLog.id))
            } else {
                await db.insert(writingLogs).values({ 
                    novelId: id, 
                    wordCount: totalWords,
                    date: new Date() 
                })
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
                
                if (chapter.content) {
                    try {
                        const contentObj = JSON.parse(chapter.content)
                        
                        const processNode = (node: any): string => {
                            if (!node) return ''
                            
                            // Handle Marks (Bold, Italic, etc.)
                            let text = node.text || ''
                            if (node.marks) {
                                node.marks.forEach((mark: any) => {
                                    if (mark.type === 'bold') text = `**${text}**`
                                    if (mark.type === 'italic') text = `*${text}*`
                                    if (mark.type === 'underline') text = `<u>${text}</u>`
                                    if (mark.type === 'strike') text = `~~${text}~~`
                                    if (mark.type === 'code') text = `\`${text}\``
                                })
                            }

                            // Handle Child Content
                            const children = node.content ? node.content.map(processNode).join('') : ''
                            
                            // Handle Node Types
                            switch (node.type) {
                                case 'text': return text
                                case 'paragraph': return `${children}\n\n`
                                case 'heading': {
                                    const level = node.attrs?.level || 1
                                    return `${'#'.repeat(level + 2)} ${children}\n\n`
                                }
                                case 'bulletList': return `${children}\n`
                                case 'orderedList': return `${children}\n`
                                case 'listItem': return `- ${children}` // Simplification for both list types
                                case 'blockquote': return `> ${children.trim().split('\n').join('\n> ')}\n\n`
                                case 'horizontalRule': return `---\n\n`
                                case 'hardBreak': return `\n`
                                default: return children || text
                            }
                        }
                        
                        if (contentObj.content) {
                            fullContent += contentObj.content.map(processNode).join('')
                        }
                    } catch (e) {
                        // Fallback: extract raw text if JSON parsing fails
                        const rawText = chapter.content.replace(/<[^>]*>/g, '').trim()
                        fullContent += rawText ? `${rawText}\n\n` : '[Nội dung chương trống]\n\n'
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
