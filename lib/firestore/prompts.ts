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
import { getFirebaseApp, isFirebaseConfigured } from '@/lib/firebase/client';
import type { PromptEntry, PromptDomain } from '@/types';

function db() {
  return getFirestore(getFirebaseApp(), 'archigram');
}

export async function fetchPrompts(options?: {
  domain?: PromptDomain;
  sort?: 'new' | 'top' | 'trending';
  limit?: number;
}): Promise<PromptEntry[]> {
  if (!isFirebaseConfigured) return [];
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
  if (!isFirebaseConfigured) return false;
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
  if (!isFirebaseConfigured) return false;
  try {
    await updateDoc(doc(db(), 'prompts', id), { likes: increment(delta) });
    return true;
  } catch (e) {
    console.warn('[Firestore] incrementPromptLikes failed', e);
    return false;
  }
}

export async function incrementPromptViews(id: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    await updateDoc(doc(db(), 'prompts', id), { views: increment(1) });
    return true;
  } catch (e) {
    console.warn('[Firestore] incrementPromptViews failed', e);
    return false;
  }
}
