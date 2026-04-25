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
