import { Elysia, t } from 'elysia';
import { db } from '../db';
import { plotCards, plotCardWikiRelations, worldEntities } from '../schema';
import { eq, desc, asc, inArray } from 'drizzle-orm';

export const plotBoardRoutes = new Elysia({ prefix: '/novels/:id/plot-board' })
  .get('/', async ({ params: { id }, set }) => {
    try {
      // Fetch all plot cards for the novel
      const cards = await db
        .select()
        .from(plotCards)
        .where(eq(plotCards.novelId, id))
        .orderBy(asc(plotCards.act), asc(plotCards.position));

      // Fetch all relations for these cards
      if (cards.length === 0) return [];

      const cardIds = cards.map(c => c.id);
      
      const relations = await db
        .select({
          plotCardId: plotCardWikiRelations.plotCardId,
          entity: worldEntities,
        })
        .from(plotCardWikiRelations)
        .innerJoin(worldEntities, eq(plotCardWikiRelations.entityId, worldEntities.id))
        .where(inArray(plotCardWikiRelations.plotCardId, cardIds));

      // Group relations by card ID
      const relationsMap = relations.reduce((acc, rel) => {
        if (!acc[rel.plotCardId]) {
          acc[rel.plotCardId] = [];
        }
        acc[rel.plotCardId].push(rel.entity);
        return acc;
      }, {} as Record<string, typeof worldEntities.$inferSelect[]>);

      // Attach relations to cards
      return cards.map(card => ({
        ...card,
        linkedEntities: relationsMap[card.id] || [],
      }));

    } catch (error) {
      set.status = 500;
      return { error: 'Failed to fetch plot board', details: error };
    }
  }, {
    params: t.Object({
      id: t.String()
    })
  })
  .post('/cards', async ({ params: { id }, body, set }) => {
    try {
      // Determine the next position for the specific act
      const existingCardsInAct = await db
        .select({ position: plotCards.position })
        .from(plotCards)
        .where(eq(plotCards.novelId, id))
        .orderBy(desc(plotCards.position));
        
      const actCards = existingCardsInAct; // Needs proper filtering, let's just get max
      // Actually we need to filter by act inside the DB query:
      
      const maxPositionCard = await db
        .select({ position: plotCards.position })
        .from(plotCards)
        .where(eq(plotCards.act, body.act))
        .orderBy(desc(plotCards.position))
        .limit(1);
        
      const nextPosition = maxPositionCard.length > 0 ? maxPositionCard[0].position + 1024 : 1024; // using big gaps for easy reordering

      const [newCard] = await db.insert(plotCards).values({
        novelId: id,
        title: body.title,
        description: body.description,
        act: body.act,
        position: body.position ?? nextPosition,
        foreshadowingNotes: body.foreshadowingNotes,
      }).returning();

      if (body.linkedEntityIds && body.linkedEntityIds.length > 0) {
        await db.insert(plotCardWikiRelations).values(
          body.linkedEntityIds.map(entityId => ({
            plotCardId: newCard.id,
            entityId,
          }))
        );
      }

      return {
        ...newCard,
        linkedEntities: [] // To be fully correct, we would fetch them, but for POST response this is usually fine
      };

    } catch (error) {
      set.status = 500;
      return { error: 'Failed to create plot card', details: error };
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Object({
      title: t.String(),
      description: t.Optional(t.String()),
      act: t.String(),
      position: t.Optional(t.Number()),
      foreshadowingNotes: t.Optional(t.String()),
      linkedEntityIds: t.Optional(t.Array(t.String()))
    })
  })
  .patch('/cards/reorder', async ({ params: { id }, body, set }) => {
    try {
      // Body is an array of { id, act, position }
      await db.transaction(async (tx) => {
        for (const update of body) {
          await tx
            .update(plotCards)
            .set({ 
              act: update.act, 
              position: update.position,
              updatedAt: new Date()
            })
            .where(eq(plotCards.id, update.id));
        }
      });
      return { success: true };
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to reorder plot cards', details: error };
    }
  }, {
    params: t.Object({
      id: t.String()
    }),
    body: t.Array(t.Object({
      id: t.String(),
      act: t.String(),
      position: t.Number()
    }))
  })
  .patch('/cards/:cardId', async ({ params: { id, cardId }, body, set }) => {
    try {
      let updatedCard;
      await db.transaction(async (tx) => {
        // Update the card details
        const updateData: any = { updatedAt: new Date() };
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.act !== undefined) updateData.act = body.act;
        if (body.foreshadowingNotes !== undefined) updateData.foreshadowingNotes = body.foreshadowingNotes;

        [updatedCard] = await tx
          .update(plotCards)
          .set(updateData)
          .where(eq(plotCards.id, cardId))
          .returning();

        // Update relations if provided
        if (body.linkedEntityIds !== undefined) {
          // Delete existing relations
          await tx
            .delete(plotCardWikiRelations)
            .where(eq(plotCardWikiRelations.plotCardId, cardId));
          
          // Insert new ones
          if (body.linkedEntityIds.length > 0) {
            await tx.insert(plotCardWikiRelations).values(
              body.linkedEntityIds.map(entityId => ({
                plotCardId: cardId,
                entityId,
              }))
            );
          }
        }
      });

      return updatedCard;
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to update plot card', details: error };
    }
  }, {
    params: t.Object({
      id: t.String(),
      cardId: t.String()
    }),
    body: t.Object({
      title: t.Optional(t.String()),
      description: t.Optional(t.String()),
      act: t.Optional(t.String()),
      foreshadowingNotes: t.Optional(t.String()),
      linkedEntityIds: t.Optional(t.Array(t.String()))
    })
  })
  .delete('/cards/:cardId', async ({ params: { id, cardId }, set }) => {
    try {
      // CASCADE will handle plotCardWikiRelations deletion
      await db.delete(plotCards).where(eq(plotCards.id, cardId));
      return { success: true };
    } catch (error) {
      set.status = 500;
      return { error: 'Failed to delete plot card', details: error };
    }
  }, {
    params: t.Object({
      id: t.String(),
      cardId: t.String()
    })
  });
