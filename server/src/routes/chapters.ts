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
            const [updatedChapter] = await db.update(chapters)
                .set({ ...body, updatedAt: new Date() })
                .where(eq(chapters.id, id))
                .returning()

            if (!updatedChapter) {
                set.status = 404
                return { error: 'Chapter not found' }
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
