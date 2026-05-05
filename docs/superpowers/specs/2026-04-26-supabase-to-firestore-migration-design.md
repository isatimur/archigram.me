# Supabase → Firestore Migration Design

**Date:** 2026-04-26  
**Status:** Approved  
**Approach:** Hard cutover (Option A — data-first)

## Overview

Migrate all remaining Supabase database tables to Firestore, then remove Supabase entirely. Auth and user diagrams/profiles are already on Firebase. This migration covers community data: diagrams, comments, collections, prompts.

Email subscribers are out of scope (feature not yet active).

## Current State

| Feature            | Supabase    | Firebase                      | Owner       |
| ------------------ | ----------- | ----------------------------- | ----------- |
| Auth               | ✅ (unused) | ✅ Google OAuth               | Firebase    |
| User diagrams      | ❌          | ✅ `users/{id}/diagrams/{id}` | Firebase    |
| User profiles      | ❌          | ✅ `users/{id}`               | Firebase    |
| Community diagrams | ✅          | ❌                            | **Migrate** |
| Comments           | ✅          | ❌                            | **Migrate** |
| Collections        | ✅          | ❌                            | **Migrate** |
| Prompts            | ✅          | ❌                            | **Migrate** |

## Approach: Data-First Hard Cutover

1. Run migration script → Supabase data lands in Firestore
2. Verify data in Firebase console
3. Update all frontend code to use new Firestore service files
4. Delete Supabase files and remove dependency

## Firestore Schema

```
/diagrams/{id}
  title: string
  description: string
  author: string
  user_id: string | null
  code: string
  diagramType: string           // 'mermaid' | 'plantuml' | 'bpmn'
  tags: string[]
  likes: number
  views: number
  created_at: Timestamp
  source_url: string | null     // for GitHub-crawled diagrams

/diagrams/{id}/comments/{id}
  user_id: string
  author: string
  content: string
  created_at: Timestamp

/collections/{id}
  title: string
  slug: string                  // unique, used for URL lookup
  description: string
  cover_image_url: string
  curator: string
  created_at: Timestamp

/collections/{id}/items/{id}
  diagram_id: string            // reference to /diagrams/{id}
  position: number

/prompts/{id}
  title: string
  author: string
  user_id: string | null
  description: string
  prompt_text: string
  domain: string                // 'General' | 'Healthcare' | 'Finance' | 'E-commerce'
  tags: string[]
  result_diagram_code: string
  likes: number
  views: number
  created_at: Timestamp
```

Existing collections stay unchanged:

```
/users/{id}               — profile doc
/users/{id}/diagrams/{id} — user's saved diagrams
```

## Firestore Indexes

Add to `firestore.indexes.json`:

| Collection    | Fields                 | Order     |
| ------------- | ---------------------- | --------- |
| `diagrams`    | `created_at`           | DESC      |
| `diagrams`    | `likes`                | DESC      |
| `prompts`     | `created_at`           | DESC      |
| `prompts`     | `likes`                | DESC      |
| `prompts`     | `domain`, `created_at` | ASC, DESC |
| `collections` | `slug`                 | ASC       |

## Security Rules

```
/diagrams/{id}
  read:  anyone
  write: authenticated users only (publish new diagrams)

/diagrams/{id}/comments/{id}
  read:  anyone
  write: authenticated (create); delete own only (request.auth.uid == resource.data.user_id)

/collections/{id}
  read:  anyone
  write: deny (admin-only, populated via migration script)

/collections/{id}/items/{id}
  read:  anyone
  write: deny

/prompts/{id}
  read:  anyone
  write: authenticated users only
```

Likes and views use `FieldValue.increment()` client-side. Authenticated users only to limit abuse.

## New Files

```
scripts/migrate-supabase-to-firestore.ts   — one-shot migration script
lib/firestore/diagrams.ts                  — community diagram CRUD
lib/firestore/comments.ts                  — comment CRUD
lib/firestore/collections.ts               — collection queries
lib/firestore/prompts.ts                   — prompt CRUD
```

### `lib/firestore/diagrams.ts` API

```typescript
fetchCommunityDiagrams(opts: { limit?: number; cursor?: DocumentSnapshot; sort?: 'latest' | 'top' }): Promise<{ diagrams: CommunityDiagram[]; cursor: DocumentSnapshot | null }>
publishDiagram(diagram: Omit<CommunityDiagram, 'id' | 'likes' | 'views' | 'created_at'>): Promise<string>
incrementDiagramLikes(id: string): Promise<void>
incrementDiagramViews(id: string): Promise<void>
fetchDiagramById(id: string): Promise<CommunityDiagram | null>
```

### `lib/firestore/comments.ts` API

```typescript
fetchComments(diagramId: string): Promise<Comment[]>
fetchCommentCounts(diagramIds: string[]): Promise<Record<string, number>>
addComment(diagramId: string, comment: Omit<Comment, 'id' | 'created_at'>): Promise<string>
deleteComment(diagramId: string, commentId: string): Promise<void>
```

### `lib/firestore/collections.ts` API

```typescript
fetchCollections(): Promise<Collection[]>
fetchCollectionBySlug(slug: string): Promise<{ collection: Collection; items: CommunityDiagram[] } | null>
```

### `lib/firestore/prompts.ts` API

```typescript
fetchPrompts(opts: { domain?: string; sort?: 'latest' | 'top'; limit?: number }): Promise<Prompt[]>
publishPrompt(prompt: Omit<Prompt, 'id' | 'likes' | 'views' | 'created_at'>): Promise<string>
incrementPromptLikes(id: string): Promise<void>
```

## Migration Script

`scripts/migrate-supabase-to-firestore.ts`

- Reads all rows from Supabase: `community_diagrams`, `comments`, `collections`, `collection_items`, `prompts`
- Maps each row to Firestore schema (field renames as needed)
- Writes in batches of 500 (Firestore limit)
- Uses Supabase row `id` as Firestore document ID → idempotent (safe to re-run)
- Prints per-collection counts on completion

Requires env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_FIREBASE_*`

## Components to Update

| Component                          | Change                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `components/CommunityGallery.tsx`  | Replace `fetchCommunityDiagrams` from supabaseClient → `lib/firestore/diagrams.ts` |
| `components/PromptMarketplace.tsx` | Replace prompt queries → `lib/firestore/prompts.ts`                                |
| `components/CommentThread.tsx`     | Replace comment CRUD → `lib/firestore/comments.ts`                                 |
| Any collection component           | Replace collection queries → `lib/firestore/collections.ts`                        |

## Files to Delete

```
lib/supabase/browser.ts
lib/supabase/server.ts
lib/supabase/admin.ts
services/supabaseClient.ts
```

Remove `@supabase/supabase-js` from `package.json`.

## Implementation Order

1. Write migration script → run it → verify data in Firebase console
2. Update `firestore.rules` and `firestore.indexes.json`
3. Write `lib/firestore/` service files
4. Update components one by one
5. Delete Supabase files + remove dependency
6. Run `bun run validate` to confirm clean build
