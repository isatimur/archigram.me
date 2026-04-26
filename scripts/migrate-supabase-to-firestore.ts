/**
 * One-shot migration: Supabase → Firestore
 * Run with: GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json bun --env-file=.env scripts/migrate-supabase-to-firestore.ts
 * Safe to re-run (uses Supabase row `id` as Firestore document ID).
 */
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_KEY!);
/* eslint-enable @typescript-eslint/no-non-null-assertion */

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? 'newagent-ba506',
});

const db = admin.firestore();
db.settings({ databaseId: 'archigram' });

async function batchWrite(
  writes: Array<{ ref: admin.firestore.DocumentReference; data: Record<string, unknown> }>
) {
  const BATCH_SIZE = 499;
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = db.batch();
    writes
      .slice(i, i + BATCH_SIZE)
      .forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
    await batch.commit();
  }
}

async function migrateDiagrams() {
  const { data, error } = await supabase
    .from('community_diagrams')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Supabase community_diagrams: ${error.message}`);
  if (!data?.length) {
    console.log('community_diagrams: 0 rows');
    return {};
  }

  const writes = data.map((row) => ({
    ref: db.collection('diagrams').doc(String(row.id)),
    data: {
      title: row.title ?? '',
      author: row.author ?? 'Anonymous',
      description: row.description ?? '',
      code: row.code ?? '',
      tags: row.tags ?? [],
      likes: row.likes ?? 0,
      views: row.views ?? 0,
      commentCount: 0,
      user_id: row.user_id ?? null,
      source_url: row.source_url ?? null,
      created_at: Timestamp.fromDate(new Date(row.created_at)),
    },
  }));
  await batchWrite(writes);
  console.log(`community_diagrams: migrated ${data.length} rows`);
  return Object.fromEntries(data.map((r) => [r.id, true]));
}

async function migrateComments(diagramIds: Record<string, boolean>) {
  const { data, error } = await supabase.from('comments').select('*');
  if (error) {
    console.log(`comments: skipped (${error.message})`);
    return;
  }
  if (!data?.length) {
    console.log('comments: 0 rows');
    return;
  }

  const counts: Record<string, number> = {};
  data.forEach((row) => {
    if (diagramIds[row.diagram_id]) {
      counts[row.diagram_id] = (counts[row.diagram_id] ?? 0) + 1;
    }
  });

  const writes = data
    .filter((row) => diagramIds[row.diagram_id])
    .map((row) => ({
      ref: db
        .collection('diagrams')
        .doc(String(row.diagram_id))
        .collection('comments')
        .doc(String(row.id)),
      data: {
        user_id: row.user_id ?? '',
        author: row.author ?? 'Anonymous',
        content: row.content ?? '',
        created_at: Timestamp.fromDate(new Date(row.created_at)),
      },
    }));
  await batchWrite(writes);

  const countWrites = Object.entries(counts).map(([id, count]) => ({
    ref: db.collection('diagrams').doc(String(id)),
    data: { commentCount: count },
  }));
  await batchWrite(countWrites);
  console.log(`comments: migrated ${writes.length} rows`);
}

async function migrateCollections() {
  const { data, error } = await supabase.from('collections').select('*');
  if (error) {
    console.log(`collections: skipped (${error.message})`);
    return {};
  }
  if (!data?.length) {
    console.log('collections: 0 rows');
    return {};
  }

  const writes = data.map((row) => ({
    ref: db.collection('collections').doc(String(row.id)),
    data: {
      title: row.title ?? '',
      slug: row.slug ?? '',
      description: row.description ?? '',
      cover_image_url: row.cover_image_url ?? null,
      curator: row.curator ?? '',
      created_at: Timestamp.fromDate(new Date(row.created_at)),
    },
  }));
  await batchWrite(writes);
  console.log(`collections: migrated ${data.length} rows`);
  return Object.fromEntries(data.map((r) => [r.id, true]));
}

async function migrateCollectionItems(collectionIds: Record<string, boolean>) {
  const { data, error } = await supabase
    .from('collection_items')
    .select('*')
    .order('position', { ascending: true });
  if (error) {
    console.log(`collection_items: skipped (${error.message})`);
    return;
  }
  if (!data?.length) {
    console.log('collection_items: 0 rows');
    return;
  }

  const writes = data
    .filter((row) => collectionIds[row.collection_id])
    .map((row) => ({
      ref: db
        .collection('collections')
        .doc(String(row.collection_id))
        .collection('items')
        .doc(String(row.id)),
      data: {
        diagram_id: String(row.diagram_id),
        position: row.position ?? 0,
      },
    }));
  await batchWrite(writes);
  console.log(`collection_items: migrated ${writes.length} rows`);
}

async function migratePrompts() {
  const { data, error } = await supabase.from('prompts').select('*');
  if (error) {
    console.log(`prompts: skipped (${error.message})`);
    return;
  }
  if (!data?.length) {
    console.log('prompts: 0 rows');
    return;
  }

  const writes = data.map((row) => ({
    ref: db.collection('prompts').doc(String(row.id)),
    data: {
      title: row.title ?? '',
      author: row.author ?? 'Anonymous',
      user_id: row.user_id ?? null,
      description: row.description ?? '',
      prompt_text: row.prompt_text ?? '',
      domain: row.domain ?? 'general',
      tags: row.tags ?? [],
      result_diagram_code: row.result_diagram_code ?? null,
      likes: row.likes ?? 0,
      views: row.views ?? 0,
      created_at: Timestamp.fromDate(new Date(row.created_at)),
    },
  }));
  await batchWrite(writes);
  console.log(`prompts: migrated ${data.length} rows`);
}

async function main() {
  console.log('Starting migration...');
  const diagramIds = await migrateDiagrams();
  await migrateComments(diagramIds);
  const collectionIds = await migrateCollections();
  await migrateCollectionItems(collectionIds);
  await migratePrompts();
  console.log('Migration complete.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
