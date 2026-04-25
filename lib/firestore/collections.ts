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
import { getFirebaseApp, isFirebaseConfigured } from '@/lib/firebase/client';
import { mapDoc } from '@/lib/firestore/diagrams';
import type { Collection, CommunityDiagram } from '@/types';

function db() {
  return getFirestore(getFirebaseApp());
}

export async function fetchCollections(): Promise<Collection[]> {
  if (!isFirebaseConfigured) return [];
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
  if (!isFirebaseConfigured) return null;
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
  if (!isFirebaseConfigured) return [];
  try {
    const itemsSnap = await getDocs(
      query(collection(db(), 'collections', collectionId, 'items'), orderBy('position', 'asc'))
    );

    const diagramIds = itemsSnap.docs.map((d) => d.data().diagram_id as string);
    const diagrams = await Promise.all(
      diagramIds.map(async (id) => {
        const snap = await getDoc(doc(db(), 'diagrams', id));
        if (!snap.exists()) return null;
        return mapDoc(snap.id, snap.data() as Record<string, unknown>);
      })
    );
    return diagrams.filter((d): d is CommunityDiagram => d !== null);
  } catch (e) {
    console.warn('[Firestore] fetchCollectionItems failed', e);
    return [];
  }
}
