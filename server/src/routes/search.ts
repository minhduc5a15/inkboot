import { Elysia, t } from 'elysia'
import { db } from '../db'
import { chapters, characters, worldEntities } from '../schema'
import { eq, like, or, and } from 'drizzle-orm'

export const searchRoutes = new Elysia({ prefix: '/search' })
    .get('/novel/:id', async ({ params: { id }, query: { q } }) => {
        if (!q) return { results: [] }
        
        const searchTerm = `%${q}%`
        
        try {
            const [foundChapters, foundCharacters, foundEntities] = await Promise.all([
                db.select().from(chapters)
                    .where(and(eq(chapters.novelId, id), or(like(chapters.title, searchTerm), like(chapters.content, searchTerm)))),
                db.select().from(characters)
                    .where(and(eq(characters.novelId, id), or(like(characters.name, searchTerm), like(characters.personality, searchTerm)))),
                db.select().from(worldEntities)
                    .where(and(eq(worldEntities.novelId, id), or(like(worldEntities.name, searchTerm), like(worldEntities.description, searchTerm))))
            ])

            return {
                chapters: foundChapters.map(c => ({ id: c.id, type: 'chapter', name: c.title })),
                characters: foundCharacters.map(c => ({ id: c.id, type: 'character', name: c.name })),
                entities: foundEntities.map(e => ({ id: e.id, type: e.type, name: e.name }))
            }
        } catch (error) {
            return { error: 'Search failed' }
        }
    }, {
        params: t.Object({
            id: t.String()
        }),
        query: t.Object({
            q: t.String()
        })
    })
