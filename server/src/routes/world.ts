import { Elysia, t } from 'elysia';
import { db } from '../db';
import { worldEntities, entityRelations } from '../schema';
import { eq, and, asc, inArray, or } from 'drizzle-orm';

export const worldRoutes = new Elysia({ prefix: '/world' })
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const [entity] = await db
          .insert(worldEntities)
          .values(body)
          .returning();
        set.status = 201;
        return entity;
      } catch (error) {
        set.status = 500;
        return { error: 'Failed to create entity', details: error };
      }
    },
    {
      body: t.Object({
        novelId: t.String(),
        type: t.String(),
        name: t.String(),
        description: t.Optional(t.String({ maxLength: 2000 })),
        content: t.Optional(t.String({ maxLength: 5000000 })),
        tags: t.Optional(
          t.Array(t.String({ pattern: '^[a-zA-Z0-9_\\-\\s\\p{L}]+$' }))
        ),
      }),
    }
  )
  .get('/novel/:novelId', async ({ params: { novelId } }) => {
    try {
      return await db
        .select()
        .from(worldEntities)
        .where(eq(worldEntities.novelId, novelId))
        .orderBy(asc(worldEntities.name));
    } catch (error) {
      return { error: 'Failed to fetch entities' };
    }
  })
  .get('/:id', async ({ params: { id }, set }) => {
    try {
      const entity = await db
        .select()
        .from(worldEntities)
        .where(eq(worldEntities.id, id))
        .limit(1);
      if (entity.length === 0) {
        set.status = 404;
        return { error: 'Entity not found' };
      }
      return entity[0];
    } catch (error) {
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .patch(
    '/:id',
    async ({ params: { id }, body }) => {
      try {
        const [updated] = await db
          .update(worldEntities)
          .set({ ...body, updatedAt: new Date() })
          .where(eq(worldEntities.id, id))
          .returning();
        return updated;
      } catch (error) {
        return { error: 'Update failed' };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String({ maxLength: 2000 })),
        content: t.Optional(t.String({ maxLength: 5000000 })),
        tags: t.Optional(
          t.Array(t.String({ pattern: '^[a-zA-Z0-9_\\-\\s\\p{L}]+$' }))
        ),
      }),
    }
  )
  .delete('/:id', async ({ params: { id } }) => {
    try {
      await db
        .delete(entityRelations)
        .where(
          or(
            eq(entityRelations.sourceEntityId, id),
            eq(entityRelations.targetEntityId, id)
          )
        );

      await db.delete(worldEntities).where(eq(worldEntities.id, id));
      return { message: 'Entity deleted' };
    } catch (error) {
      return { error: 'Delete failed' };
    }
  })
  .post(
    '/relations',
    async ({ body, set }) => {
      try {
        const [relation] = await db
          .insert(entityRelations)
          .values(body)
          .returning();
        set.status = 201;
        return relation;
      } catch (error) {
        set.status = 500;
        return { error: 'Failed to create relation', details: error };
      }
    },
    {
      body: t.Object({
        sourceEntityId: t.String(),
        targetEntityId: t.String(),
        relationType: t.String(),
      }),
    }
  )
  .get('/relations/:novelId', async ({ params: { novelId } }) => {
    try {
      // Standard inner join for better performance and scale
      return await db
        .select({
          id: entityRelations.id,
          sourceEntityId: entityRelations.sourceEntityId,
          targetEntityId: entityRelations.targetEntityId,
          relationType: entityRelations.relationType,
          createdAt: entityRelations.createdAt,
        })
        .from(entityRelations)
        .innerJoin(
          worldEntities,
          eq(entityRelations.sourceEntityId, worldEntities.id)
        )
        .where(eq(worldEntities.novelId, novelId));
    } catch (error) {
      return { error: 'Failed to fetch relations' };
    }
  })
  .delete('/relations/:id', async ({ params: { id } }) => {
    try {
      await db.delete(entityRelations).where(eq(entityRelations.id, id));
      return { message: 'Relation deleted' };
    } catch (error) {
      return { error: 'Delete failed' };
    }
  });
