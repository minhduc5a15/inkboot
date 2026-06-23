import { Elysia, t } from 'elysia'
import { db } from '../db'
import { chapters, worldEntities } from '../schema'
import { eq, like, or, and, sql } from 'drizzle-orm'

export const searchRoutes = new Elysia({ prefix: '/search' })
    .get('/novel/:id', async ({ params: { id }, query: { q } }) => {
        if (!q) return { results: [] }
        
        const searchTerm = `%${q}%`
        
        try {
            const [foundChapters, foundEntities] = await Promise.all([
                db.select().from(chapters)
                    .where(and(eq(chapters.novelId, id), or(like(chapters.title, searchTerm), like(chapters.content, searchTerm)))),
                db.select().from(worldEntities)
                    .where(and(
                        eq(worldEntities.novelId, id), 
                        or(
                            like(worldEntities.name, searchTerm), 
                            like(worldEntities.description, searchTerm),
                            sql`${worldEntities.metadata}->>'personality' ILIKE ${searchTerm}`
                        )
                    ))
            ])

            return {
                chapters: foundChapters.map(c => ({ id: c.id, type: 'chapter', name: c.title })),
                characters: foundEntities.filter(e => e.type === 'character').map(c => ({ id: c.id, type: 'character', name: c.name })),
                entities: foundEntities.filter(e => e.type !== 'character').map(e => ({ id: e.id, type: e.type, name: e.name }))
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
