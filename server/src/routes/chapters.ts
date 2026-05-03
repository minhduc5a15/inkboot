import { Elysia, t } from 'elysia'
import { db } from '../db'
import { chapters, chapterVersions } from '../schema'
import { eq, desc } from 'drizzle-orm'

export const chapterRoutes = new Elysia({ prefix: '/chapters' })
    .post('/', async ({ body, set }) => {
        try {
            const [chapter] = await db.insert(chapters).values(body).returning()
            set.status = 201
            return chapter
        } catch (error) {
            set.status = 500
            return { error: 'Failed to create chapter', details: error }
        }
    }, {
        body: t.Object({
            title: t.String(),
            content: t.String(),
            order: t.Number(),
            novelId: t.String()
        })
    })
    .get('/:id', async ({ params: { id }, set }) => {
        try {
            const chapter = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1)

            if (chapter.length === 0) {
                set.status = 404
                return { error: 'Chapter not found' }
            }

            return chapter[0]
        } catch (error) {
            set.status = 500
            return { error: 'Internal server error', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })
    .patch('/:id', async ({ params: { id }, body, set }) => {
        try {
            const [oldChapter] = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1)
            if (!oldChapter) {
                set.status = 404
                return { error: 'Chapter not found' }
            }

            const [updatedChapter] = await db.update(chapters)
                .set({ ...body, updatedAt: new Date() })
                .where(eq(chapters.id, id))
                .returning()

            // Auto-snapshot logic
            if (body.content) {
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

                const [lastVersion] = await db.select()
                    .from(chapterVersions)
                    .where(eq(chapterVersions.chapterId, id))
                    .orderBy(desc(chapterVersions.createdAt))
                    .limit(1)

                const currentWordCount = calculateWords(body.content)
                const lastWordCount = lastVersion ? calculateWords(lastVersion.content) : 0
                const timeDiff = lastVersion ? (new Date().getTime() - new Date(lastVersion.createdAt).getTime()) : Infinity
                
                const shouldSnapshot = !lastVersion || 
                    (timeDiff > 30 * 60 * 1000) ||
                    (Math.abs(currentWordCount - lastWordCount) > 500)

                if (shouldSnapshot) {
                    await db.insert(chapterVersions).values({
                        chapterId: id,
                        content: body.content
                    })
                }
            }

            return updatedChapter
        } catch (error) {
            set.status = 500
            return { error: 'Failed to update chapter', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            title: t.Optional(t.String()),
            content: t.Optional(t.String()),
            order: t.Optional(t.Number())
        })
    })
    .patch('/:id/restore', async ({ params: { id }, body, set }) => {
        try {
            const [version] = await db.select().from(chapterVersions).where(eq(chapterVersions.id, body.versionId)).limit(1)
            if (!version) {
                set.status = 404
                return { error: 'Version not found' }
            }

            const [updatedChapter] = await db.update(chapters)
                .set({ content: version.content, updatedAt: new Date() })
                .where(eq(chapters.id, id))
                .returning()

            return updatedChapter
        } catch (error) {
            set.status = 500
            return { error: 'Failed to restore chapter', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            versionId: t.String()
        })
    })
    .delete('/:id', async ({ params: { id }, set }) => {
        try {
            const [deletedChapter] = await db.delete(chapters)
                .where(eq(chapters.id, id))
                .returning()

            if (!deletedChapter) {
                set.status = 404
                return { error: 'Chapter not found' }
            }

            return { message: 'Chapter deleted successfully' }
        } catch (error) {
            set.status = 500
            return { error: 'Failed to delete chapter', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })
    .post('/:id/versions', async ({ params: { id }, body, set }) => {
        try {
            const [version] = await db.insert(chapterVersions).values({
                chapterId: id,
                content: body.content
            }).returning()
            set.status = 201
            return version
        } catch (error) {
            set.status = 500
            return { error: 'Failed to save version', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            content: t.String()
        })
    })
    .get('/:id/versions', async ({ params: { id } }) => {
        try {
            return await db.select()
                .from(chapterVersions)
                .where(eq(chapterVersions.chapterId, id))
                .orderBy(desc(chapterVersions.createdAt))
        } catch (error) {
            return { error: 'Failed to fetch versions', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })
