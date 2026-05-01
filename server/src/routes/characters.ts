import { Elysia, t } from 'elysia'
import { db } from '../db'
import { characters } from '../schema'
import { eq } from 'drizzle-orm'

export const characterRoutes = new Elysia({ prefix: '/characters' })
    .post('/', async ({ body, set }) => {
        try {
            const [character] = await db.insert(characters).values({
                ...body,
                updatedAt: new Date()
            }).returning()
            set.status = 201
            return character
        } catch (error) {
            set.status = 500
            return { error: 'Failed to create character', details: error }
        }
    }, {
        body: t.Object({
            name: t.String(),
            age: t.Optional(t.Number()),
            appearance: t.Optional(t.String()),
            personality: t.Optional(t.String()),
            history: t.Optional(t.String()),
            novelId: t.String()
        })
    })
    .patch('/:id', async ({ params: { id }, body, set }) => {
        try {
            const [updatedCharacter] = await db.update(characters)
                .set({ ...body, updatedAt: new Date() })
                .where(eq(characters.id, id))
                .returning()

            if (!updatedCharacter) {
                set.status = 404
                return { error: 'Character not found' }
            }

            return updatedCharacter
        } catch (error) {
            set.status = 500
            return { error: 'Failed to update character', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Object({
            name: t.Optional(t.String()),
            age: t.Optional(t.Number()),
            appearance: t.Optional(t.String()),
            personality: t.Optional(t.String()),
            history: t.Optional(t.String())
        })
    })
    .delete('/:id', async ({ params: { id }, set }) => {
        try {
            const [deletedCharacter] = await db.delete(characters)
                .where(eq(characters.id, id))
                .returning()

            if (!deletedCharacter) {
                set.status = 404
                return { error: 'Character not found' }
            }

            return { message: 'Character deleted successfully' }
        } catch (error) {
            set.status = 500
            return { error: 'Failed to delete character', details: error }
        }
    }, {
        params: t.Object({
            id: t.String()
        })
    })
