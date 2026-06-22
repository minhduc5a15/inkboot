import { db } from './db';
import { novels, chapters, plotCards, worldEntities, plotCardWikiRelations } from './schema';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('Seeding database...');
  try {
    // 1. Insert a Novel
    const [novel] = await db.insert(novels).values({
      title: 'The Obsidian Crown',
      description: 'A romantasy about a cursed prince and a rogue mage.',
    }).returning();

    console.log(`Created Novel: ${novel.id}`);

    // 2. Insert Entities (Wiki)
    const [character1, character2, location] = await db.insert(worldEntities).values([
      { novelId: novel.id, type: 'character', name: 'Elara', description: 'A rogue mage with forbidden magic.' },
      { novelId: novel.id, type: 'character', name: 'Prince Kael', description: 'The cursed heir to the Obsidian throne.' },
      { novelId: novel.id, type: 'location', name: 'The Ashen Wastes', description: 'A barren land where magic is warped.' }
    ]).returning();

    // 3. Insert Plot Cards
    const [card1] = await db.insert(plotCards).values([
      { novelId: novel.id, title: 'The Meeting', description: 'Elara tries to steal from Kael in the market.', act: 'act1', position: 1024, foreshadowingNotes: 'Notice the ring Kael wears.' },
      { novelId: novel.id, title: 'The Ambush', description: 'They are attacked by shadowy beasts in the Wastes.', act: 'act2a', position: 1024 },
      { novelId: novel.id, title: 'The Betrayal', description: 'Kael discovers Elara\'s true identity.', act: 'act2b', position: 1024 },
      { novelId: novel.id, title: 'The Final Stand', description: 'Facing the Usurper together.', act: 'act3', position: 1024 }
    ]).returning();

    // 4. Link Plot Card to Entity
    await db.insert(plotCardWikiRelations).values([
      { plotCardId: card1.id, entityId: character1.id },
      { plotCardId: card1.id, entityId: character2.id }
    ]);

    // 5. Insert Chapters
    await db.insert(chapters).values([
      { novelId: novel.id, title: 'Chapter 1: Shadows in the Market', order: 1, content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"The market was crowded..."}]}]}' },
      { novelId: novel.id, title: 'Chapter 2: The Prince\'s Secret', order: 2, content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"He touched the ring..."}]}]}' }
    ]);

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seed();
