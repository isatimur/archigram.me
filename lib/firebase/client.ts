'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
} from 'firebase/firestore';
import { updateProfile as updateFirebaseAuthProfile } from 'firebase/auth';
import type { Project, User } from '@/types';

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyCA26n0s84MhrLBu6SnqsLn-tahRi3gff8',
  authDomain: 'newagent-ba506.firebaseapp.com',
  databaseURL: 'https://newagent-ba506.firebaseio.com',
  projectId: 'newagent-ba506',
  storageBucket: 'newagent-ba506.firebasestorage.app',
  messagingSenderId: '1007672315550',
  appId: '1:1007672315550:web:861e93e723d99ccbddb58f',
  measurementId: 'G-VCGG421FRV',
};

const firebaseConfig = {
  apiKey:
    (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ||
    (process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string | undefined) ||
    defaultFirebaseConfig.apiKey,
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ||
    (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string | undefined) ||
    defaultFirebaseConfig.authDomain,
  databaseURL:
    (import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined) ||
    (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL as string | undefined) ||
    defaultFirebaseConfig.databaseURL,
  projectId:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ||
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string | undefined) ||
    defaultFirebaseConfig.projectId,
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ||
    (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string | undefined) ||
    defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ||
    (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ||
    defaultFirebaseConfig.messagingSenderId,
  appId:
    (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) ||
    (process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string | undefined) ||
    defaultFirebaseConfig.appId,
  measurementId:
    (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) ||
    defaultFirebaseConfig.measurementId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;

export function getFirebaseApp() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* environment variables.');
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

export async function initFirebaseAnalytics() {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getAnalytics(getFirebaseApp());
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp(), 'archigram');
}

function mapFirebaseUser(user: FirebaseUser): User {
  return {
    id: user.uid,
    email: user.email ?? undefined,
    username: user.displayName ?? user.email?.split('@')[0],
    avatar_url: user.photoURL ?? undefined,
    created_at: user.metadata.creationTime,
  };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isFirebaseConfigured) return null;
  const auth = getFirebaseAuth();
  return auth.currentUser ? mapFirebaseUser(auth.currentUser) : null;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(getFirebaseAuth(), (user) => {
    callback(user ? mapFirebaseUser(user) : null);
  });
}

export async function signInWithGoogle(): Promise<{ user: User | null; error: string | null }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const result = await signInWithPopup(getFirebaseAuth(), provider);
    return { user: mapFirebaseUser(result.user), error: null };
  } catch (error: unknown) {
    return { user: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function signOutFirebase() {
  await signOut(getFirebaseAuth());
}

export async function fetchUserProfile(userId: string): Promise<{
  username?: string;
  bio?: string;
  social_link?: string;
  avatar_url?: string;
} | null> {
  if (!isFirebaseConfigured) return null;
  try {
    const snapshot = await getDoc(doc(getFirebaseDb(), 'users', userId));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.warn('[Firebase] Failed to fetch user profile', error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  profile: { username?: string; bio?: string; social_link?: string; avatar_url?: string }
): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    if (profile.username && getFirebaseAuth().currentUser?.uid === userId) {
      await updateFirebaseAuthProfile(getFirebaseAuth().currentUser, {
        displayName: profile.username,
      });
    }
    await setDoc(doc(getFirebaseDb(), 'users', userId), profile, { merge: true });
    return true;
  } catch (error) {
    console.warn('[Firebase] Failed to update user profile', error);
    return false;
  }
}

export async function fetchUserDiagrams(userId: string): Promise<Project[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snapshot = await getDocs(collection(getFirebaseDb(), 'users', userId, 'diagrams'));
    return snapshot.docs
      .map((item) => item.data() as Project)
      .filter((project) => Boolean(project.id))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.warn('[Firebase] Failed to fetch user diagrams', error);
    return [];
  }
}

export async function upsertUserDiagram(userId: string, project: Project): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    await setDoc(doc(getFirebaseDb(), 'users', userId, 'diagrams', project.id), project, {
      merge: true,
    });
    return true;
  } catch (error) {
    console.warn('[Firebase] Failed to sync user diagram', error);
    return false;
  }
}

export async function deleteUserDiagram(userId: string, projectId: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    await deleteDoc(doc(getFirebaseDb(), 'users', userId, 'diagrams', projectId));
    return true;
  } catch (error) {
    console.warn('[Firebase] Failed to delete user diagram', error);
    return false;
  }
}
