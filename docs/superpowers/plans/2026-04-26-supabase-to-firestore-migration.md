# Supabase → Firestore Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all community data (diagrams, comments, collections, prompts) from Supabase to Firestore, then remove Supabase entirely.

**Architecture:** Data-first hard cutover — run a one-shot migration script to populate Firestore, then replace all Supabase imports across 6 components/hooks with 4 new `lib/firestore/` service files, then delete Supabase. Auth and user diagrams are already on Firebase and are not touched.

**Tech Stack:** Firebase JS SDK v10 (`firebase/firestore`, `firebase/app`), `@supabase/supabase-js` (read-only during migration script), Vite + React 19 + TypeScript.

---

## File Map

**Create:**

- `scripts/migrate-supabase-to-firestore.ts` — one-shot script, run locally once
- `lib/firestore/diagrams.ts` — community diagram CRUD (replaces supabaseClient diagram fns)
- `lib/firestore/comments.ts` — comment CRUD (replaces supabaseClient comment fns)
- `lib/firestore/collections.ts` — collection queries (replaces supabaseClient collection fns)
- `lib/firestore/prompts.ts` — prompt CRUD (replaces supabaseClient prompt fns)

**Modify:**

- `types.ts` — add `commentCount?: number` to `CommunityDiagram`
- `firestore.rules` — add rules for new collections
- `firestore.indexes.json` — add composite indexes
- `components/CommunityGallery.tsx` — swap supabase imports for firestore
- `components/CommentThread.tsx` — swap supabase imports for firestore
- `components/PromptMarketplace.tsx` — swap supabase imports for firestore
- `components/DiscoverPage.tsx` — swap supabase imports for firestore
- `components/PublishPromptModal.tsx` — swap supabase import for firestore
- `hooks/usePublishFlow.ts` — swap supabase import for firestore

**Delete (Task 9):**

- `lib/supabase/browser.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `services/supabaseClient.ts`

---

## Task 1: Update Firestore rules and indexes

**Files:**

- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`

- [ ] **Step 1: Replace `firestore.rules` with the following**

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId}/diagrams/{diagramId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /diagrams/{diagramId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if false;
    }

    match /diagrams/{diagramId}/comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && request.auth.uid == resource.data.user_id;
      allow update: if false;
    }

    match /collections/{collectionId} {
      allow read: if true;
      allow write: if false;
    }

    match /collections/{collectionId}/items/{itemId} {
      allow read: if true;
      allow write: if false;
    }

    match /prompts/{promptId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

- [ ] **Step 2: Replace `firestore.indexes.json` with the following**

```json
{
  "indexes": [
    {
      "collectionGroup": "diagrams",
      "queryScope": "COLLECTION",
      "fields": [{ "fieldPath": "created_at", "order": "DESCENDING" }]
    },
    {
      "collectionGroup": "diagrams",
      "queryScope": "COLLECTION",
      "fields": [{ "fieldPath": "likes", "order": "DESCENDING" }]
    },
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION",
      "fields": [{ "fieldPath": "created_at", "order": "DESCENDING" }]
    },
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION",
      "fields": [{ "fieldPath": "likes", "order": "DESCENDING" }]
    },
    {
      "collectionGroup": "prompts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "domain", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules firestore.indexes.json
git commit -m "feat(firestore): add rules and indexes for community collections"
```

---

## Task 2: Add `commentCount` to `CommunityDiagram` type

**Files:**

- Modify: `types.ts:59-71`

- [ ] **Step 1: Add `commentCount` field to `CommunityDiagram`**

In `types.ts`, change:

```typescript
export interface CommunityDiagram {
  id: string;
  title: string;
  author: string;
  description: string;
  code: string;
  likes: number;
  views: number;
  tags: string[];
  createdAt: string;
  /** Timestamp for sorting (ms). Optional for static fallback data. */
  createdAtTimestamp?: number;
}
```

to:

```typescript
export interface CommunityDiagram {
  id: string;
  title: string;
  author: string;
  description: string;
  code: string;
  likes: number;
  views: number;
  tags: string[];
  createdAt: string;
  /** Timestamp for sorting (ms). Optional for static fallback data. */
  createdAtTimestamp?: number;
  commentCount?: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add types.ts
git commit -m "feat(types): add commentCount to CommunityDiagram"
```

---

## Task 3: Create `lib/firestore/diagrams.ts`

**Files:**

- Create: `lib/firestore/diagrams.ts`

- [ ] **Step 1: Create the file**

```typescript
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  getFirestore,
} from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase/client';
import type { CommunityDiagram } from '@/types';

function db() {
  return getFirestore(getFirebaseApp());
}

function mapDoc(id: string, d: Record<string, unknown>): CommunityDiagram {
  const ts = d.created_at as { toMillis?: () => number } | null;
  const ms = ts?.toMillis?.() ?? 0;
  return {
    id,
    title: (d.title as string) || '',
    author: (d.author as string) || 'Anonymous',
    description: (d.description as string) || '',
    code: (d.code as string) || '',
    likes: (d.likes as number) || 0,
    views: (d.views as number) || 0,
    tags: (d.tags as string[]) || [],
    commentCount: (d.commentCount as number) || 0,
    createdAt: ms ? new Date(ms).toLocaleDateString() : '',
    createdAtTimestamp: ms,
  };
}

export async function fetchCommunityDiagrams(n = 100): Promise<CommunityDiagram[]> {
  try {
    const q = query(collection(db(), 'diagrams'), orderBy('created_at', 'desc'), limit(n));
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
  } catch (e) {
    console.warn('[Firestore] fetchCommunityDiagrams failed', e);
    return [];
  }
}

export async function publishDiagram(diagram: {
  title: string;
  author: string;
  description: string;
  code: string;
  tags: string[];
  user_id?: string | null;
}): Promise<boolean> {
  try {
    await addDoc(collection(db(), 'diagrams'), {
      title: diagram.title,
      author: diagram.author,
      description: diagram.description,
      code: diagram.code,
      tags: diagram.tags,
      user_id: diagram.user_id ?? null,
      likes: 0,
      views: 0,
      commentCount: 0,
      created_at: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.warn('[Firestore] publishDiagram failed', e);
    return false;
  }
}

export async function incrementDiagramLikes(id: string, delta: 1 | -1): Promise<boolean> {
  try {
    await updateDoc(doc(db(), 'diagrams', id), { likes: increment(delta) });
    return true;
  } catch (e) {
    console.warn('[Firestore] incrementDiagramLikes failed', e);
    return false;
  }
}

export async function incrementDiagramViews(id: string): Promise<boolean> {
  try {
    await updateDoc(doc(db(), 'diagrams', id), { views: increment(1) });
    return true;
  } catch (e) {
    console.warn('[Firestore] incrementDiagramViews failed', e);
    return false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/firestore/diagrams.ts
git commit -m "feat(firestore): add diagrams service"
```

---

## Task 4: Create `lib/firestore/comments.ts`

**Files:**

- Create: `lib/firestore/comments.ts`

- [ ] **Step 1: Create the file**

```typescript
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  increment,
  updateDoc,
  getFirestore,
} from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase/client';
import type { Comment } from '@/types';

function db() {
  return getFirestore(getFirebaseApp());
}

export async function fetchComments(diagramId: string): Promise<Comment[]> {
  try {
    const q = query(
      collection(db(), 'diagrams', diagramId, 'comments'),
      orderBy('created_at', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const ts = data.created_at as { toDate?: () => Date } | null;
      return {
        id: d.id,
        diagram_id: diagramId,
        user_id: data.user_id as string,
        author: data.author as string,
        content: data.content as string,
        created_at: ts?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      };
    });
  } catch (e) {
    console.warn('[Firestore] fetchComments failed', e);
    return [];
  }
}

export async function addComment(
  diagramId: string,
  content: string,
  author: string,
  userId: string
): Promise<Comment | null> {
  try {
    const ref = await addDoc(collection(db(), 'diagrams', diagramId, 'comments'), {
      user_id: userId,
      author,
      content,
      created_at: serverTimestamp(),
    });
    // Increment denormalized count on the diagram doc
    await updateDoc(doc(db(), 'diagrams', diagramId), { commentCount: increment(1) });
    return {
      id: ref.id,
      diagram_id: diagramId,
      user_id: userId,
      author,
      content,
      created_at: new Date().toISOString(),
    };
  } catch (e) {
    console.warn('[Firestore] addComment failed', e);
    return null;
  }
}

export async function deleteComment(diagramId: string, commentId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db(), 'diagrams', diagramId, 'comments', commentId));
    await updateDoc(doc(db(), 'diagrams', diagramId), { commentCount: increment(-1) });
    return true;
  } catch (e) {
    console.warn('[Firestore] deleteComment failed', e);
    return false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/firestore/comments.ts
git commit -m "feat(firestore): add comments service"
```

---

## Task 5: Create `lib/firestore/collections.ts`

**Files:**

- Create: `lib/firestore/collections.ts`

- [ ] **Step 1: Create the file**

```typescript
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  where,
  getFirestore,
} from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase/client';
import type { Collection, CommunityDiagram } from '@/types';

function db() {
  return getFirestore(getFirebaseApp());
}

export async function fetchCollections(): Promise<Collection[]> {
  try {
    const q = query(collection(db(), 'collections'), orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const ts = data.created_at as { toDate?: () => Date } | null;
      return {
        id: d.id,
        title: data.title as string,
        slug: data.slug as string,
        description: data.description as string,
        cover_image_url: data.cover_image_url as string | undefined,
        curator: data.curator as string,
        created_at: ts?.toDate?.()?.toISOString() ?? '',
      };
    });
  } catch (e) {
    console.warn('[Firestore] fetchCollections failed', e);
    return [];
  }
}

export async function fetchCollectionBySlug(
  slug: string
): Promise<{ collection: Collection; items: CommunityDiagram[] } | null> {
  try {
    const q = query(collection(db(), 'collections'), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const colDoc = snap.docs[0];
    const colData = colDoc.data();
    const ts = colData.created_at as { toDate?: () => Date } | null;
    const col: Collection = {
      id: colDoc.id,
      title: colData.title as string,
      slug: colData.slug as string,
      description: colData.description as string,
      cover_image_url: colData.cover_image_url as string | undefined,
      curator: colData.curator as string,
      created_at: ts?.toDate?.()?.toISOString() ?? '',
    };

    const items = await fetchCollectionItems(colDoc.id);
    return { collection: col, items };
  } catch (e) {
    console.warn('[Firestore] fetchCollectionBySlug failed', e);
    return null;
  }
}

export async function fetchCollectionItems(collectionId: string): Promise<CommunityDiagram[]> {
  try {
    const itemsSnap = await getDocs(
      query(collection(db(), 'collections', collectionId, 'items'), orderBy('position', 'asc'))
    );

    const diagramIds = itemsSnap.docs.map((d) => d.data().diagram_id as string);
    const diagrams = await Promise.all(
      diagramIds.map(async (id) => {
        const snap = await getDoc(doc(db(), 'diagrams', id));
        if (!snap.exists()) return null;
        const d = snap.data();
        const ts = d.created_at as { toMillis?: () => number } | null;
        const ms = ts?.toMillis?.() ?? 0;
        return {
          id: snap.id,
          title: d.title as string,
          author: (d.author as string) || 'Anonymous',
          description: (d.description as string) || '',
          code: d.code as string,
          likes: (d.likes as number) || 0,
          views: (d.views as number) || 0,
          tags: (d.tags as string[]) || [],
          commentCount: (d.commentCount as number) || 0,
          createdAt: ms ? new Date(ms).toLocaleDateString() : '',
          createdAtTimestamp: ms,
        } as CommunityDiagram;
      })
    );
    return diagrams.filter((d): d is CommunityDiagram => d !== null);
  } catch (e) {
    console.warn('[Firestore] fetchCollectionItems failed', e);
    return [];
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/firestore/collections.ts
git commit -m "feat(firestore): add collections service"
```

---

## Task 6: Create `lib/firestore/prompts.ts`

**Files:**

- Create: `lib/firestore/prompts.ts`

- [ ] **Step 1: Create the file**

```typescript
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  increment,
  getFirestore,
} from 'firebase/firestore';
import { getFirebaseApp } from '@/lib/firebase/client';
import type { PromptEntry, PromptDomain } from '@/types';

function db() {
  return getFirestore(getFirebaseApp());
}

export async function fetchPrompts(options?: {
  domain?: PromptDomain;
  sort?: 'new' | 'top' | 'trending';
  limit?: number;
}): Promise<PromptEntry[]> {
  const n = options?.limit ?? 50;
  try {
    const sortField =
      options?.sort === 'top' ? 'likes' : options?.sort === 'trending' ? 'views' : 'created_at';
    let q = query(collection(db(), 'prompts'), orderBy(sortField, 'desc'), limit(n));
    if (options?.domain && options.domain !== 'general') {
      q = query(
        collection(db(), 'prompts'),
        where('domain', '==', options.domain),
        orderBy(sortField, 'desc'),
        limit(n)
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      const ts = data.created_at as { toDate?: () => Date } | null;
      return {
        id: d.id,
        title: data.title as string,
        author: data.author as string,
        user_id: data.user_id as string | undefined,
        description: data.description as string,
        prompt_text: data.prompt_text as string,
        domain: data.domain as PromptDomain,
        tags: (data.tags as string[]) || [],
        result_diagram_code: data.result_diagram_code as string | undefined,
        likes: (data.likes as number) || 0,
        views: (data.views as number) || 0,
        created_at: ts?.toDate?.()?.toISOString() ?? '',
      };
    });
  } catch (e) {
    console.warn('[Firestore] fetchPrompts failed', e);
    return [];
  }
}

export async function publishPrompt(prompt: {
  title: string;
  author: string;
  description: string;
  prompt_text: string;
  domain: PromptDomain;
  tags: string[];
  result_diagram_code?: string;
  user_id?: string;
}): Promise<boolean> {
  try {
    await addDoc(collection(db(), 'prompts'), {
      title: prompt.title,
      author: prompt.author,
      description: prompt.description,
      prompt_text: prompt.prompt_text,
      domain: prompt.domain,
      tags: prompt.tags,
      result_diagram_code: prompt.result_diagram_code ?? null,
      user_id: prompt.user_id ?? null,
      likes: 0,
      views: 0,
      created_at: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.warn('[Firestore] publishPrompt failed', e);
    return false;
  }
}

export async function incrementPromptLikes(id: string, delta: 1 | -1): Promise<boolean> {
  try {
    await updateDoc(doc(db(), 'prompts', id), { likes: increment(delta) });
    return true;
  } catch (e) {
    console.warn('[Firestore] incrementPromptLikes failed', e);
    return false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/firestore/prompts.ts
git commit -m "feat(firestore): add prompts service"
```

---

## Task 7: Write the migration script

**Files:**

- Create: `scripts/migrate-supabase-to-firestore.ts`

- [ ] **Step 1: Create the script**

```typescript
/**
 * One-shot migration: Supabase → Firestore
 * Run with: bun scripts/migrate-supabase-to-firestore.ts
 * Safe to re-run (uses Supabase row `id` as Firestore document ID).
 */
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, Timestamp } from 'firebase/firestore';

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_KEY!);

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY!,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.VITE_FIREBASE_APP_ID!,
};

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
  // Return id map for comment migration
  return Object.fromEntries(data.map((r) => [r.id, true]));
}

async function migrateComments(diagramIds: Record<string, boolean>) {
  const { data, error } = await supabase.from('comments').select('*');
  if (error) throw new Error(`Supabase comments: ${error.message}`);
  if (!data?.length) {
    console.log('comments: 0 rows');
    return;
  }

  // Count comments per diagram for denormalized field
  const counts: Record<string, number> = {};
  data.forEach((row) => {
    if (diagramIds[row.diagram_id]) {
      counts[row.diagram_id] = (counts[row.diagram_id] ?? 0) + 1;
    }
  });

  // Write comments as subcollections
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

  // Update commentCount on each diagram doc
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
```

- [ ] **Step 2: Commit the script**

```bash
git add scripts/migrate-supabase-to-firestore.ts
git commit -m "feat(scripts): add Supabase→Firestore one-shot migration script"
```

- [ ] **Step 3: Run the migration** (requires `.env` file with both Supabase and Firebase vars)

```bash
bun --env-file=.env scripts/migrate-supabase-to-firestore.ts
```

Expected output:

```
Starting migration...
community_diagrams: migrated N rows
comments: migrated N rows
collections: migrated N rows
collection_items: migrated N rows
prompts: migrated N rows
Migration complete.
```

- [ ] **Step 4: Verify in Firebase console**

Open Firebase Console → Firestore → check that `/diagrams`, `/collections`, `/prompts` collections contain data matching what was in Supabase. Spot-check a diagram document has `commentCount` set correctly.

---

## Task 8: Update `CommunityGallery.tsx`

**Files:**

- Modify: `components/CommunityGallery.tsx`

- [ ] **Step 1: Replace supabase imports at the top of the file**

Remove:

```typescript
import {
  fetchCommunityDiagrams,
  fetchCommentCounts,
  updateDiagramLikes,
  incrementDiagramViews,
} from '../services/supabaseClient.ts';
```

Add:

```typescript
import {
  fetchCommunityDiagrams,
  incrementDiagramLikes,
  incrementDiagramViews,
} from '../lib/firestore/diagrams.ts';
```

- [ ] **Step 2: Update the data loading `useEffect`**

Remove the separate `fetchCommentCounts` call. Comment counts now come from each diagram's `commentCount` field. Find the `loadData` function and change it from:

```typescript
const loadData = async () => {
  setIsLoading(true);
  const result = await fetchCommunityDiagrams({ limit: 100 });
  let loadedDiagrams: CommunityDiagram[];
  if (result.data && result.data.length > 0) {
    loadedDiagrams = result.data;
  } else {
    loadedDiagrams = COMMUNITY_DATA;
  }
  setDiagrams(loadedDiagrams);
  const ids = loadedDiagrams.map((d) => d.id);
  const counts = await fetchCommentCounts(ids);
  setCommentCounts(counts);
  setIsLoading(false);
};
```

to:

```typescript
const loadData = async () => {
  setIsLoading(true);
  const loaded = await fetchCommunityDiagrams(100);
  const loadedDiagrams = loaded.length > 0 ? loaded : COMMUNITY_DATA;
  setDiagrams(loadedDiagrams);
  const counts: Record<string, number> = {};
  loadedDiagrams.forEach((d) => {
    counts[d.id] = d.commentCount ?? 0;
  });
  setCommentCounts(counts);
  setIsLoading(false);
};
```

- [ ] **Step 3: Update `performLike` to use atomic increment**

Find the `performLike` function. Change:

```typescript
const success = await updateDiagramLikes(id, newLikes);
```

to:

```typescript
const success = await incrementDiagramLikes(id, isLiked ? -1 : 1);
```

- [ ] **Step 4: Run type-check**

```bash
bun run type-check
```

Expected: no errors related to `CommunityGallery.tsx`.

- [ ] **Step 5: Commit**

```bash
git add components/CommunityGallery.tsx
git commit -m "feat(gallery): migrate CommunityGallery from Supabase to Firestore"
```

---

## Task 9: Update `CommentThread.tsx`

**Files:**

- Modify: `components/CommentThread.tsx`

- [ ] **Step 1: Replace supabase import**

Remove:

```typescript
import { fetchComments, addComment, deleteComment } from '../services/supabaseClient.ts';
```

Add:

```typescript
import { fetchComments, addComment, deleteComment } from '../lib/firestore/comments.ts';
```

- [ ] **Step 2: Update `addComment` call signature**

In Supabase, the call was `addComment(diagramId, content, author)`.
In Firestore it is `addComment(diagramId, content, author, userId)`.

Find all calls to `addComment(` in the file. They will look like:

```typescript
const comment = await addComment(diagramId, content, author);
```

Change to pass the authenticated user's ID. The component should already have access to `user` prop. Update to:

```typescript
const comment = await addComment(diagramId, content, author, user.id);
```

- [ ] **Step 3: Update `deleteComment` call signature**

In Supabase, the call was `deleteComment(commentId)`.
In Firestore it is `deleteComment(diagramId, commentId)`.

Find all calls to `deleteComment(` and update to:

```typescript
await deleteComment(diagramId, commentId);
```

- [ ] **Step 4: Run type-check**

```bash
bun run type-check
```

Expected: no errors related to `CommentThread.tsx`.

- [ ] **Step 5: Commit**

```bash
git add components/CommentThread.tsx
git commit -m "feat(comments): migrate CommentThread from Supabase to Firestore"
```

---

## Task 10: Update `PromptMarketplace.tsx`

**Files:**

- Modify: `components/PromptMarketplace.tsx`

- [ ] **Step 1: Replace supabase import**

Remove:

```typescript
import { fetchPrompts, updatePromptLikes } from '../services/supabaseClient.ts';
```

Add:

```typescript
import { fetchPrompts, incrementPromptLikes } from '../lib/firestore/prompts.ts';
```

- [ ] **Step 2: Update the like handler**

Find calls to `updatePromptLikes(id, newCount)` and change to use atomic increment. The optimistic pattern stays the same, just change the server call:

```typescript
// Before
await updatePromptLikes(id, newCount);

// After (delta is 1 when liking, -1 when unliking)
await incrementPromptLikes(id, isLiked ? -1 : 1);
```

- [ ] **Step 3: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/PromptMarketplace.tsx
git commit -m "feat(prompts): migrate PromptMarketplace from Supabase to Firestore"
```

---

## Task 11: Update `DiscoverPage.tsx`

**Files:**

- Modify: `components/DiscoverPage.tsx`

- [ ] **Step 1: Replace supabase import**

Remove:

```typescript
import { fetchCollections, fetchCollectionItems } from '../services/supabaseClient.ts';
```

Add:

```typescript
import { fetchCollections, fetchCollectionItems } from '../lib/firestore/collections.ts';
```

- [ ] **Step 2: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/DiscoverPage.tsx
git commit -m "feat(discover): migrate DiscoverPage from Supabase to Firestore"
```

---

## Task 12: Update `PublishPromptModal.tsx` and `usePublishFlow.ts`

**Files:**

- Modify: `components/PublishPromptModal.tsx`
- Modify: `hooks/usePublishFlow.ts`

- [ ] **Step 1: Update `PublishPromptModal.tsx` import**

Remove:

```typescript
import { publishPrompt } from '../services/supabaseClient.ts';
```

Add:

```typescript
import { publishPrompt } from '../lib/firestore/prompts.ts';
```

Check if `publishPrompt` is called with a `user_id`. If the component has access to the current user, pass `user_id: user?.id`. The Firestore `publishPrompt` accepts an optional `user_id` field — add it to the call if not already present.

- [ ] **Step 2: Update `usePublishFlow.ts` import**

Remove:

```typescript
import { publishDiagram } from '@/lib/supabase/browser';
```

Add:

```typescript
import { publishDiagram } from '@/lib/firestore/diagrams';
```

The `publishDiagram` call at line ~63 passes `{ title, author, description, code, tags }`. The Firestore version also accepts an optional `user_id`. Update the call to include it:

```typescript
const success = await publishDiagram({
  title: publishData.title,
  author: user?.username || publishData.author || 'Anonymous',
  description: publishData.description,
  code,
  tags: tagsArray,
  user_id: user?.id ?? null,
});
```

- [ ] **Step 3: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/PublishPromptModal.tsx hooks/usePublishFlow.ts
git commit -m "feat(publish): migrate publish flows from Supabase to Firestore"
```

---

## Task 13: Delete Supabase files and remove dependency

**Files:**

- Delete: `lib/supabase/browser.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `services/supabaseClient.ts`
- Modify: `package.json`

- [ ] **Step 1: Check no remaining imports**

```bash
grep -r "supabaseClient\|@supabase\|lib/supabase" \
  --include="*.ts" --include="*.tsx" \
  components/ hooks/ lib/ services/ app/ \
  | grep -v "node_modules"
```

Expected: no output. If any files still import from Supabase, fix them before proceeding.

- [ ] **Step 2: Delete Supabase source files**

```bash
rm lib/supabase/browser.ts lib/supabase/server.ts lib/supabase/admin.ts services/supabaseClient.ts
rmdir lib/supabase 2>/dev/null || true
```

- [ ] **Step 3: Remove `@supabase/supabase-js` from `package.json`**

Run:

```bash
bun remove @supabase/supabase-js
```

- [ ] **Step 4: Run full validation**

```bash
bun run validate
```

Expected: type-check passes, lint passes, tests pass with no Supabase-related failures.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Supabase — fully migrated to Firestore"
```
