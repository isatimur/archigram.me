import { Icon } from '@iconify/react';
import React, { useState, useEffect } from 'react';
import { User as UserType, Project } from '@/types';
import {
  fetchUserDiagrams,
  deleteUserDiagram,
  fetchUserProfile,
  updateUserProfile,
} from '@/lib/firebase/client';
import { toast } from 'sonner';

interface ProfilePageProps {
  user: UserType;
  projects: Project[];
  onSignOut: () => void;
  onOpenDiagram: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

function normalizeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname) return null;
    url.username = '';
    url.password = '';
    return url.href;
  } catch {
    return null;
  }
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  projects,
  onSignOut,
  onOpenDiagram,
  onDeleteProject,
}) => {
  const [username, setUsername] = useState(user.username || '');
  const [editingUsername, setEditingUsername] = useState(false);
  const [bio, setBio] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [cloudDiagrams, setCloudDiagrams] = useState<Project[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDangerZone, setShowDangerZone] = useState(false);

  // Sanitize social link: only allow http/https to prevent javascript: XSS
  const safeSocialHref = React.useMemo(() => {
    if (!socialLink) return null;
    return normalizeHttpUrl(socialLink);
  }, [socialLink]);

  useEffect(() => {
    fetchUserDiagrams(user.id).then((diagrams) => {
      setCloudDiagrams(diagrams);
      setIsLoadingCloud(false);
    });
    fetchUserProfile(user.id).then((profile) => {
      if (profile) {
        setUsername(profile.username ?? user.username ?? '');
        setBio(profile.bio ?? '');
        setSocialLink(profile.social_link ?? '');
      } else {
        updateUserProfile(user.id, {
          username: user.username ?? undefined,
          avatar_url: user.avatar_url ?? undefined,
        });
      }
    });
  }, [user.id, user.username, user.avatar_url]);

  const saveUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    const ok = await updateUserProfile(user.id, { username: trimmed });
    if (!ok) {
      toast.error('Failed to update username');
    } else {
      toast.success('Username updated');
      setEditingUsername(false);
    }
  };

  const saveProfile = async () => {
    const ok = await updateUserProfile(user.id, {
      bio: bio.trim(),
      social_link: socialLink.trim(),
      username: username.trim() || undefined,
      avatar_url: user.avatar_url,
    });
    if (!ok) {
      toast.error('Failed to save profile');
    } else {
      toast.success('Profile saved');
      setEditingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    toast.info('Please contact support to delete your account.');
    onSignOut();
  };

  const handleDeleteDiagram = async (id: string) => {
    const ok = await deleteUserDiagram(user.id, id);
    if (ok) {
      setCloudDiagrams((prev) => prev.filter((d) => d.id !== id));
      onDeleteProject(id);
    } else {
      toast.error('Failed to delete diagram');
    }
  };

  const initials = (user.username || user.email || 'U').slice(0, 2).toUpperCase();

  // Combine cloud and local, deduplicate by id (cloud wins)
  const allDiagrams = [
    ...cloudDiagrams,
    ...projects.filter((p) => !cloudDiagrams.find((c) => c.id === p.id)),
  ];

  return (
    <div className="min-h-screen bg-background text-text p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold select-none">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {editingUsername ? (
            <div className="flex items-center gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveUsername();
                  if (e.key === 'Escape') setEditingUsername(false);
                }}
                className="text-xl font-bold bg-surface border border-border rounded px-2 py-1 text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <button
                onClick={saveUsername}
                aria-label="Save username"
                className="text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <Icon icon="lucide:check" className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingUsername(false)}
                aria-label="Cancel"
                className="text-text-muted hover:text-text transition-colors"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{user.username || 'Anonymous'}</h1>
              <button
                onClick={() => setEditingUsername(true)}
                aria-label="Edit username"
                className="text-text-muted hover:text-primary transition-colors flex-shrink-0"
              >
                <Icon icon="lucide:edit-2" className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="text-sm text-text-muted truncate">{user.email}</div>
          {user.created_at && (
            <div className="text-xs text-text-muted mt-0.5">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </div>
          )}
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text border border-border rounded-lg hover:bg-surface-hover transition-colors flex-shrink-0"
        >
          <Icon icon="lucide:log-out" className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* Bio & Social Link */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
            Profile Details
          </h2>
          <div className="flex items-center gap-2">
            {user.username && (
              <a
                href={`/u/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Icon icon="lucide:external-link" className="w-3 h-3" />
                View public profile
              </a>
            )}
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="text-text-muted hover:text-primary transition-colors"
                aria-label="Edit profile details"
              >
                <Icon icon="lucide:edit-2" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {editingProfile ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                maxLength={160}
                placeholder="Tell people about yourself..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Website / Social link</label>
              <input
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                placeholder="https://github.com/you"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Icon icon="lucide:check" className="w-3.5 h-3.5" />
                Save
              </button>
              <button
                onClick={() => setEditingProfile(false)}
                className="px-3 py-1.5 text-xs text-text-muted hover:text-text border border-border rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-text">
              {bio || <span className="text-text-muted italic">No bio yet.</span>}
            </p>
            {safeSocialHref && (
              <a
                href={safeSocialHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Icon icon="lucide:external-link" className="w-3 h-3" />
                {safeSocialHref.replace(/^https?:\/\//i, '')}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(
          [
            { icon: 'lucide:layout-dashboard', label: 'Diagrams', value: allDiagrams.length },
            { icon: 'lucide:heart', label: 'Likes received', value: '—' },
            {
              icon: 'lucide:bar-chart-2',
              label: 'Published',
              value: isLoadingCloud ? '…' : cloudDiagrams.length,
            },
          ] as const
        ).map(({ icon, label, value }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <Icon icon={icon} className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Diagrams */}
      <h2 className="text-lg font-bold mb-4">My Diagrams</h2>
      {isLoadingCloud ? (
        <div className="flex items-center justify-center py-12 text-text-muted gap-2">
          <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading diagrams…</span>
        </div>
      ) : allDiagrams.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <Icon icon="lucide:layout" className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No diagrams yet. Create your first one in the editor!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {allDiagrams.map((diagram) => (
            <div
              key={diagram.id}
              className="bg-surface border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
            >
              <h3 className="font-semibold text-sm mb-1 truncate">{diagram.name}</h3>
              <p className="text-xs text-text-muted mb-3">
                {new Date(diagram.updatedAt).toLocaleDateString()}
              </p>
              <pre className="text-xs text-text-muted bg-background rounded p-2 h-16 overflow-hidden mb-3 font-mono leading-relaxed">
                {diagram.code.slice(0, 120)}
              </pre>
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenDiagram(diagram)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
                >
                  <Icon icon="lucide:external-link" className="w-3 h-3" />
                  Open
                </button>
                <button
                  onClick={() => handleDeleteDiagram(diagram.id)}
                  aria-label={`Delete ${diagram.name}`}
                  className="flex items-center justify-center gap-1 text-xs px-2 py-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Icon icon="lucide:trash-2" className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      <div className="border border-red-500/20 rounded-xl p-4">
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="flex items-center gap-2 text-red-500 text-sm font-medium w-full text-left"
        >
          <Icon icon="lucide:alert-triangle" className="w-4 h-4" />
          Danger Zone
        </button>
        {showDangerZone && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-text-muted">
              To delete your account, type <strong className="text-text">DELETE</strong> below and
              confirm.
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE'}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
