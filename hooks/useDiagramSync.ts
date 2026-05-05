import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Project, User } from '@/types';
import { fetchUserDiagrams, upsertUserDiagram } from '@/lib/firebase/client';

/**
 * Merge local and cloud project arrays.
 * On id conflict, the project with the higher updatedAt wins.
 * Exported for testing.
 */
export function mergeProjects(local: Project[], cloud: Project[]): Project[] {
  const map = new Map<string, Project>();

  for (const p of cloud) map.set(p.id, p);

  for (const p of local) {
    const existing = map.get(p.id);
    if (!existing || p.updatedAt > existing.updatedAt) {
      map.set(p.id, p);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

interface UseDiagramSyncOptions {
  user: User | null;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
}

/**
 * Syncs localStorage projects with Firebase Firestore on sign-in.
 * On every project save, upserts to Firestore in the background (fire-and-forget).
 */
export function useDiagramSync({ user, projects, setProjects }: UseDiagramSyncOptions) {
  const syncedUserIdRef = useRef<string | null>(null);
  const syncErrorShownRef = useRef(false);

  // On sign-in: fetch cloud diagrams and merge with local
  useEffect(() => {
    if (!user) {
      syncedUserIdRef.current = null;
      syncErrorShownRef.current = false;
      return;
    }
    if (syncedUserIdRef.current === user.id) return; // already synced this session
    syncedUserIdRef.current = user.id;

    (async () => {
      const cloudProjects = await fetchUserDiagrams(user.id);
      const merged = mergeProjects(projects, cloudProjects);
      setProjects(merged);

      // Upload any local-only projects to cloud
      const toUpload = projects.filter((p) => {
        const inCloud = cloudProjects.find((c) => c.id === p.id);
        return !inCloud || p.updatedAt > (inCloud.updatedAt || 0);
      });
      const results = await Promise.all(toUpload.map((p) => upsertUserDiagram(user.id, p)));
      if (results.some((ok) => !ok) && !syncErrorShownRef.current) {
        syncErrorShownRef.current = true;
        toast.error('Some diagrams failed to sync to cloud — changes are saved locally');
      }
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Background sync: upsert whenever projects change and user is logged in
  const prevProjectsRef = useRef<Project[]>([]);
  useEffect(() => {
    if (!user) return;
    const prev = prevProjectsRef.current;
    const changed = projects.filter((p) => {
      const old = prev.find((o) => o.id === p.id);
      return !old || p.updatedAt > old.updatedAt;
    });
    prevProjectsRef.current = projects;
    if (changed.length === 0) return;

    Promise.all(changed.map((p) => upsertUserDiagram(user.id, p))).then((results) => {
      if (results.some((ok) => !ok) && !syncErrorShownRef.current) {
        syncErrorShownRef.current = true;
        toast.error('Cloud sync failed — changes are saved locally');
      }
    });
  }, [user, projects]);
}
