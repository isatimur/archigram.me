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
