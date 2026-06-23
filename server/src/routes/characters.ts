import { Elysia, t } from 'elysia';
import { db } from '../db';
import { worldEntities, entityRelations } from '../schema';
import { eq, or, and } from 'drizzle-orm';

export const characterRoutes = new Elysia({ prefix: '/characters' })
  .post(
    '/',
    async ({ body, set }) => {
      try {
        const [character] = await db
          .insert(worldEntities)
          .values({
            name: body.name,
            novelId: body.novelId,
            metadata: {
              age: body.age === null ? undefined : body.age,
              appearance: body.appearance,
              personality: body.personality,
              history: body.history,
            },
            type: 'character',
            updatedAt: new Date(),
          })
          .returning();
        set.status = 201;
        return {
          ...character,
          ...(character.metadata || {})
        };
      } catch (error) {
        set.status = 500;
        return { error: 'Failed to create character', details: error };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        age: t.Optional(t.Union([t.Number(), t.Null()])),
        appearance: t.Optional(t.String()),
        personality: t.Optional(t.String()),
        history: t.Optional(t.String()),
        novelId: t.String(),
      }),
    }
  )
  .patch(
    '/:id',
    async ({ params: { id }, body, set }) => {
      try {
        // Fetch existing to merge metadata
        const existing = await db.select().from(worldEntities).where(and(eq(worldEntities.id, id), eq(worldEntities.type, 'character'))).limit(1);
        if (existing.length === 0) {
          set.status = 404;
          return { error: 'Character not found' };
        }
        
        const currentMetadata = existing[0].metadata || {};
        
        const [updatedCharacter] = await db
          .update(worldEntities)
          .set({ 
            name: body.name !== undefined ? body.name : existing[0].name,
            metadata: {
              ...currentMetadata,
              ...(body.age !== undefined && { age: body.age === null ? undefined : body.age }),
              ...(body.appearance !== undefined && { appearance: body.appearance }),
              ...(body.personality !== undefined && { personality: body.personality }),
              ...(body.history !== undefined && { history: body.history }),
            },
            updatedAt: new Date()
          })
          .where(and(eq(worldEntities.id, id), eq(worldEntities.type, 'character')))
          .returning();

        if (!updatedCharacter) {
          set.status = 404;
          return { error: 'Character not found' };
        }

        return {
          ...updatedCharacter,
          ...(updatedCharacter.metadata || {})
        };
      } catch (error) {
        set.status = 500;
        return { error: 'Failed to update character', details: error };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        age: t.Optional(t.Union([t.Number(), t.Null()])),
        appearance: t.Optional(t.String()),
        personality: t.Optional(t.String()),
        history: t.Optional(t.String()),
      }),
    }
  )
  .delete(
    '/:id',
    async ({ params: { id }, set }) => {
      try {
        await db
          .delete(entityRelations)
          .where(
            or(
              eq(entityRelations.sourceEntityId, id),
              eq(entityRelations.targetEntityId, id)
            )
          );
        const [deletedCharacter] = await db
          .delete(worldEntities)
          .where(and(eq(worldEntities.id, id), eq(worldEntities.type, 'character')))
          .returning();

        if (!deletedCharacter) {
          set.status = 404;
          return { error: 'Character not found' };
        }

        return { message: 'Character deleted successfully' };
      } catch (error) {
        set.status = 500;
        return { error: 'Failed to delete character', details: error };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
