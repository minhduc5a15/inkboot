import { Elysia, t } from 'elysia'
import { db } from '../db'
import { worldEntities, entityRelations } from '../schema'
import { eq, and, asc, inArray } from 'drizzle-orm'

export const worldRoutes = new Elysia({ prefix: '/world' })
    .post('/', async ({ body, set }) => {
        try {
            const [entity] = await db.insert(worldEntities).values(body).returning()
            set.status = 201
            return entity
        } catch (error) {
            set.status = 500
            return { error: 'Failed to create entity', details: error }
        }
    }, {
        body: t.Object({
            novelId: t.String(),
            type: t.String(),
            name: t.String(),
            description: t.Optional(t.String()),
            content: t.Optional(t.String()),
            tags: t.Optional(t.Array(t.String()))
        })
    })
    .get('/novel/:novelId', async ({ params: { novelId } }) => {
        try {
            return await db.select().from(worldEntities)
                .where(eq(worldEntities.novelId, novelId))
                .orderBy(asc(worldEntities.name))
        } catch (error) {
            return { error: 'Failed to fetch entities' }
        }
    })
    .get('/:id', async ({ params: { id }, set }) => {
        try {
            const entity = await db.select().from(worldEntities).where(eq(worldEntities.id, id)).limit(1)
            if (entity.length === 0) {
                set.status = 404
                return { error: 'Entity not found' }
            }
            return entity[0]
        } catch (error) {
            set.status = 500
            return { error: 'Internal server error' }
        }
    })
    .patch('/:id', async ({ params: { id }, body }) => {
        try {
            const [updated] = await db.update(worldEntities)
                .set({ ...body, updatedAt: new Date() })
                .where(eq(worldEntities.id, id))
                .returning()
            return updated
        } catch (error) {
            return { error: 'Update failed' }
        }
    }, {
        body: t.Object({
            name: t.Optional(t.String()),
            description: t.Optional(t.String()),
            content: t.Optional(t.String()),
            tags: t.Optional(t.Array(t.String()))
        })
    })
    .delete('/:id', async ({ params: { id } }) => {
        try {
            await db.delete(worldEntities).where(eq(worldEntities.id, id))
            return { message: 'Entity deleted' }
        } catch (error) {
            return { error: 'Delete failed' }
        }
    })
    .post('/relations', async ({ body, set }) => {
        try {
            const [relation] = await db.insert(entityRelations).values(body).returning()
            set.status = 201
            return relation
        } catch (error) {
            set.status = 500
            return { error: 'Failed to create relation', details: error }
        }
    }, {
        body: t.Object({
            sourceEntityId: t.String(),
            targetEntityId: t.String(),
            relationType: t.String()
        })
    })
    .get('/relations/:novelId', async ({ params: { novelId } }) => {
        try {
            // This is slightly tricky as we need to find relations for entities belonging to this novel.
            // But sourceEntityId and targetEntityId are UUIDs. 
            // Let's assume for now we just want to fetch relations where source belongs to the novel.
            // Or better, we join with worldEntities to ensure novelId matches.
            
            // For simplicity in this prototype, let's fetch all and filter or just rely on the UI 
            // knowing which entities are in the novel.
            // Actually, a better way is to fetch relations where source exists in worldEntities for that novel.
            
            // SQL-like: select * from entity_relations where source_entity_id in (select id from world_entities where novel_id = novelId)
            
            const entities = await db.select({ id: worldEntities.id }).from(worldEntities).where(eq(worldEntities.novelId, novelId))
            const entityIds = entities.map(e => e.id)
            
            if (entityIds.length === 0) return []

            return await db.select().from(entityRelations).where(inArray(entityRelations.sourceEntityId, entityIds))
        } catch (error) {
            return { error: 'Failed to fetch relations' }
        }
    })
    .delete('/relations/:id', async ({ params: { id } }) => {
        try {
            await db.delete(entityRelations).where(eq(entityRelations.id, id))
            return { message: 'Relation deleted' }
        } catch (error) {
            return { error: 'Delete failed' }
        }
    })
