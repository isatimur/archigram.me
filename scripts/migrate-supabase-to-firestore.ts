/**
 * One-shot migration: Supabase → Firestore
 * Run with: bun --env-file=.env scripts/migrate-supabase-to-firestore.ts
 * Safe to re-run (uses Supabase row `id` as Firestore document ID).
 */
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, writeBatch, Timestamp } from 'firebase/firestore';

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_KEY!);

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY!,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.VITE_FIREBASE_APP_ID!,
};
/* eslint-enable @typescript-eslint/no-non-null-assertion */

const app = getApps()[0] ?? initializeApp(firebaseConfig);
const db = getFirestore(app);

async function batchWrite(
  writes: Array<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }>
) {
  const BATCH_SIZE = 499;
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
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
    ref: doc(db, 'diagrams', String(row.id)),
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
  if (error) throw new Error(`Supabase comments: ${error.message}`);
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
      ref: doc(db, 'diagrams', String(row.diagram_id), 'comments', String(row.id)),
      data: {
        user_id: row.user_id ?? '',
        author: row.author ?? 'Anonymous',
        content: row.content ?? '',
        created_at: Timestamp.fromDate(new Date(row.created_at)),
      },
    }));
  await batchWrite(writes);

  const countWrites = Object.entries(counts).map(([id, count]) => ({
    ref: doc(db, 'diagrams', String(id)),
    data: { commentCount: count },
  }));
  await batchWrite(countWrites);
  console.log(`comments: migrated ${writes.length} rows`);
}

async function migrateCollections() {
  const { data, error } = await supabase.from('collections').select('*');
  if (error) throw new Error(`Supabase collections: ${error.message}`);
  if (!data?.length) {
    console.log('collections: 0 rows');
    return {};
  }

  const writes = data.map((row) => ({
    ref: doc(db, 'collections', String(row.id)),
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
  if (error) throw new Error(`Supabase collection_items: ${error.message}`);
  if (!data?.length) {
    console.log('collection_items: 0 rows');
    return;
  }

  const writes = data
    .filter((row) => collectionIds[row.collection_id])
    .map((row) => ({
      ref: doc(db, 'collections', String(row.collection_id), 'items', String(row.id)),
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
  if (error) throw new Error(`Supabase prompts: ${error.message}`);
  if (!data?.length) {
    console.log('prompts: 0 rows');
    return;
  }

  const writes = data.map((row) => ({
    ref: doc(db, 'prompts', String(row.id)),
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
