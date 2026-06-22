import { Elysia, t } from 'elysia'
import { db } from '../db'
import { timelineEvents } from '../schema'
import { eq, asc } from 'drizzle-orm'

export const timelineRoutes = new Elysia({ prefix: '/timeline' })
    .post('/', async ({ body, set }) => {
        try {
            const [event] = await db.insert(timelineEvents).values({
                ...body,
                updatedAt: new Date()
            }).returning()
            set.status = 201
            return event
        } catch (error) {
            set.status = 500
            return { error: 'Failed to create timeline event', details: error }
        }
    }, {
        body: t.Object({
            title: t.String(),
            content: t.Optional(t.String()),
            datePoint: t.Optional(t.String()),
            type: t.Optional(t.String()),
            arc: t.Optional(t.String()),
            novelId: t.String()
        })
    })
    .patch('/:id', async ({ params: { id }, body, set }) => {
        try {
            const [updatedEvent] = await db.update(timelineEvents)
                .set({ ...body, updatedAt: new Date() })
                .where(eq(timelineEvents.id, id))
                .returning()

            if (!updatedEvent) {
                set.status = 404
                return { error: 'Event not found' }
            }

            return updatedEvent
        } catch (error) {
            set.status = 500
            return { error: 'Failed to update event', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            title: t.Optional(t.String()),
            content: t.Optional(t.String()),
            datePoint: t.Optional(t.String()),
            type: t.Optional(t.String()),
            arc: t.Optional(t.String())
        })
    })
    .delete('/:id', async ({ params: { id }, set }) => {
        try {
            const [deleted] = await db.delete(timelineEvents)
                .where(eq(timelineEvents.id, id))
                .returning()

            if (!deleted) {
                set.status = 404
                return { error: 'Event not found' }
            }

            return { message: 'Event deleted successfully' }
        } catch (error) {
            set.status = 500
            return { error: 'Failed to delete event', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })
