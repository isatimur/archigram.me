import {
  collection,
  getDocs,
  doc,
  query,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
  getFirestore,
} from 'firebase/firestore';
import { getFirebaseApp, isFirebaseConfigured } from '@/lib/firebase/client';
import type { Comment } from '@/types';

function db() {
  return getFirestore(getFirebaseApp());
}

export async function fetchComments(diagramId: string): Promise<Comment[]> {
  if (!isFirebaseConfigured) return [];
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
  if (!isFirebaseConfigured) return null;
  try {
    const batch = writeBatch(db());
    const commentRef = doc(collection(db(), 'diagrams', diagramId, 'comments'));
    batch.set(commentRef, {
      user_id: userId,
      author,
      content,
      created_at: serverTimestamp(),
    });
    batch.update(doc(db(), 'diagrams', diagramId), { commentCount: increment(1) });
    await batch.commit();
    return {
      id: commentRef.id,
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
  if (!isFirebaseConfigured) return false;
  try {
    const batch = writeBatch(db());
    batch.delete(doc(db(), 'diagrams', diagramId, 'comments', commentId));
    batch.update(doc(db(), 'diagrams', diagramId), { commentCount: increment(-1) });
    await batch.commit();
    return true;
  } catch (e) {
    console.warn('[Firestore] deleteComment failed', e);
    return false;
  }
}
