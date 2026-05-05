import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { mergeProjects, useDiagramSync } from '../../hooks/useDiagramSync.ts';
import type { Project, User } from '../../types.ts';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/lib/firebase/client', () => ({
  fetchUserDiagrams: vi.fn(),
  upsertUserDiagram: vi.fn(),
}));

import { toast } from 'sonner';
import { fetchUserDiagrams, upsertUserDiagram } from '@/lib/firebase/client';

const mockFetch = fetchUserDiagrams as ReturnType<typeof vi.fn>;
const mockUpsert = upsertUserDiagram as ReturnType<typeof vi.fn>;
const mockToast = toast.error as ReturnType<typeof vi.fn>;

const makeUser = (id = 'u1'): User => ({ id, email: 'test@example.com' });
const makeProject = (id: string, updatedAt = 1000): Project => ({
  id,
  name: id,
  code: 'x',
  updatedAt,
});

describe('mergeProjects', () => {
  it('returns local projects when cloud is empty', () => {
    const local: Project[] = [{ id: '1', name: 'A', code: 'x', updatedAt: 1000 }];
    const result = mergeProjects(local, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns cloud projects when local is empty', () => {
    const cloud: Project[] = [{ id: '2', name: 'B', code: 'y', updatedAt: 2000 }];
    const result = mergeProjects([], cloud);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('prefers newer updatedAt on conflict', () => {
    const local: Project[] = [{ id: '1', name: 'local', code: 'local', updatedAt: 3000 }];
    const cloud: Project[] = [{ id: '1', name: 'cloud', code: 'cloud', updatedAt: 1000 }];
    const result = mergeProjects(local, cloud);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('local');
  });

  it('deduplicates by id', () => {
    const local: Project[] = [{ id: '1', name: 'A', code: 'a', updatedAt: 1000 }];
    const cloud: Project[] = [
      { id: '1', name: 'A-cloud', code: 'a', updatedAt: 500 },
      { id: '2', name: 'B', code: 'b', updatedAt: 2000 },
    ];
    const result = mergeProjects(local, cloud);
    expect(result).toHaveLength(2);
  });
});

describe('useDiagramSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue([]);
    mockUpsert.mockResolvedValue(true);
  });

  it('fetches cloud diagrams and merges on sign-in', async () => {
    const local = [makeProject('p1')];
    const cloud = [makeProject('p2', 2000)];
    mockFetch.mockResolvedValue(cloud);

    const setProjects = vi.fn();
    renderHook(() => useDiagramSync({ user: makeUser(), projects: local, setProjects }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('u1'));
    await waitFor(() => expect(setProjects).toHaveBeenCalled());
    const merged = setProjects.mock.calls[0][0] as Project[];
    expect(merged.some((p) => p.id === 'p1')).toBe(true);
    expect(merged.some((p) => p.id === 'p2')).toBe(true);
  });

  it('shows error toast when initial upsert fails', async () => {
    mockFetch.mockResolvedValue([]);
    mockUpsert.mockResolvedValue(false);

    const local = [makeProject('p1')];
    renderHook(() => useDiagramSync({ user: makeUser(), projects: local, setProjects: vi.fn() }));

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.stringContaining('sync')));
  });

  it('shows error toast when background upsert fails', async () => {
    mockFetch.mockResolvedValue([]);
    mockUpsert.mockResolvedValue(false);

    const setProjects = vi.fn();
    const { rerender } = renderHook(
      ({ projects }: { projects: Project[] }) =>
        useDiagramSync({ user: makeUser(), projects, setProjects }),
      { initialProps: { projects: [] } }
    );

    // Trigger a background sync by changing projects
    act(() => {
      rerender({ projects: [makeProject('p1', 9999)] });
    });

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.stringContaining('sync')));
  });

  it('does not show duplicate toast on repeated failures', async () => {
    mockFetch.mockResolvedValue([]);
    mockUpsert.mockResolvedValue(false);

    const setProjects = vi.fn();
    const { rerender } = renderHook(
      ({ projects }: { projects: Project[] }) =>
        useDiagramSync({ user: makeUser(), projects, setProjects }),
      { initialProps: { projects: [makeProject('p1')] } }
    );

    await waitFor(() => expect(mockToast).toHaveBeenCalledTimes(1));

    act(() => {
      rerender({ projects: [makeProject('p1', 5000)] });
    });

    // Still only one toast
    await waitFor(() => expect(mockToast).toHaveBeenCalledTimes(1));
  });

  it('resets error flag on sign-out', async () => {
    mockFetch.mockResolvedValue([]);
    mockUpsert.mockResolvedValue(false);

    const setProjects = vi.fn();
    const { rerender } = renderHook(
      ({ user }: { user: User | null }) =>
        useDiagramSync({ user, projects: [makeProject('p1')], setProjects }),
      { initialProps: { user: makeUser() as User | null } }
    );

    await waitFor(() => expect(mockToast).toHaveBeenCalledTimes(1));

    // Sign out, then sign back in — error flag should reset
    act(() => rerender({ user: null }));
    act(() => rerender({ user: makeUser() }));

    await waitFor(() => expect(mockToast).toHaveBeenCalledTimes(2));
  });
});
