import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '../utils/test-utils.tsx';
import type { Props } from '@/components/ModalRenderer';

vi.mock('@/lib/contexts/UIContext', () => ({
  useUI: vi.fn(),
}));

vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/contexts/EditorContext', () => ({
  useEditor: vi.fn(),
}));

// Mock lazy-loaded components with forwardRef to ensure they're rendered synchronously
vi.mock('@/components/AuthModal', () => ({
  default: () => <div data-testid="auth-modal">Auth Modal</div>,
}));

vi.mock('@/components/PublishModal', () => ({
  default: () => <div data-testid="publish-modal">Publish Modal</div>,
}));

vi.mock('@/components/PublishPromptModal', () => ({
  default: () => <div data-testid="publish-prompt-modal">Publish Prompt Modal</div>,
}));

vi.mock('@/components/ImageImportModal', () => ({
  default: () => <div data-testid="image-import-modal">Image Import Modal</div>,
}));

vi.mock('@/components/AuditModal', () => ({
  default: () => <div data-testid="audit-modal">Audit Modal</div>,
}));

vi.mock('@/components/CommandPalette', () => ({
  default: () => <div data-testid="command-palette">Command Palette</div>,
}));

vi.mock('@/components/KeyboardShortcutsModal', () => ({
  default: () => <div data-testid="keyboard-shortcuts-modal">Keyboard Shortcuts Modal</div>,
}));

import { useUI } from '@/lib/contexts/UIContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useEditor } from '@/lib/contexts/EditorContext';
import ModalRenderer from '@/components/ModalRenderer';

const baseUI = {
  isPublishModalOpen: false,
  setIsPublishModalOpen: vi.fn(),
  isImageImportModalOpen: false,
  setIsImageImportModalOpen: vi.fn(),
  isAuditModalOpen: false,
  setIsAuditModalOpen: vi.fn(),
  isCommandPaletteOpen: false,
  setIsCommandPaletteOpen: vi.fn(),
  isShortcutsModalOpen: false,
  setIsShortcutsModalOpen: vi.fn(),
  isPublishPromptModalOpen: false,
  setIsPublishPromptModalOpen: vi.fn(),
  viewMode: 'split',
  setViewMode: vi.fn(),
  activePanel: null,
  setActivePanel: vi.fn(),
  theme: 'dark',
  setTheme: vi.fn(),
  isCopilotOpen: false,
  setIsCopilotOpen: vi.fn(),
};

const baseAuth = {
  isAuthModalOpen: false,
  setIsAuthModalOpen: vi.fn(),
  user: null,
  authModalMode: 'signin',
  onAuthSuccess: vi.fn(),
  openAuth: vi.fn(),
  handleSignOut: vi.fn(async () => {}),
  setUser: vi.fn(),
  setAuthModalMode: vi.fn(),
  requireAuth: vi.fn(),
};

const baseEditor = {
  code: '',
  handleImageImport: vi.fn(),
  projects: [],
  activeProjectId: '',
  setProjects: vi.fn(),
  addProject: vi.fn(),
  deleteProject: vi.fn(),
  updateProject: vi.fn(),
  setActiveProjectId: vi.fn(),
  setCode: vi.fn(),
  history: [],
  historyIndex: 0,
  undo: vi.fn(),
  redo: vi.fn(),
  customStyle: {},
  setCustomStyle: vi.fn(),
  saveStatus: 'saved',
  currentProject: null,
  duplicateProject: vi.fn(),
  addVersion: vi.fn(),
  versions: [],
  saveToCloud: vi.fn(),
};

const defaultProps: Props = {
  auditReport: null,
  isAuditing: false,
  isPublishing: false,
  publishData: { title: '', author: '', description: '', tags: '' },
  setPublishData: vi.fn(),
  submitPublish: vi.fn(async () => {}),
  pendingPromptText: '',
  pendingPromptResultCode: undefined,
  consumeExternalPrompt: vi.fn(),
  onScanImage: vi.fn(),
};

describe('ModalRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when all flags are false', () => {
    vi.mocked(useUI).mockReturnValue(baseUI as never);
    vi.mocked(useAuth).mockReturnValue(baseAuth as never);
    vi.mocked(useEditor).mockReturnValue(baseEditor as never);

    const { queryByTestId } = render(<ModalRenderer {...defaultProps} />);

    // All modals should not be rendered
    expect(queryByTestId('auth-modal')).not.toBeInTheDocument();
    expect(queryByTestId('publish-modal')).not.toBeInTheDocument();
    expect(queryByTestId('image-import-modal')).not.toBeInTheDocument();
    expect(queryByTestId('audit-modal')).not.toBeInTheDocument();
    expect(queryByTestId('command-palette')).not.toBeInTheDocument();
    expect(queryByTestId('keyboard-shortcuts-modal')).not.toBeInTheDocument();
    expect(queryByTestId('publish-prompt-modal')).not.toBeInTheDocument();
  });

  it('renders AuthModal when isAuthModalOpen is true', async () => {
    vi.mocked(useUI).mockReturnValue(baseUI as never);
    vi.mocked(useAuth).mockReturnValue({ ...baseAuth, isAuthModalOpen: true } as never);
    vi.mocked(useEditor).mockReturnValue(baseEditor as never);

    const { queryByTestId } = render(<ModalRenderer {...defaultProps} />);
    await waitFor(() => {
      expect(queryByTestId('auth-modal')).toBeInTheDocument();
    });
  });

  it('renders PublishModal when isPublishModalOpen is true', async () => {
    vi.mocked(useUI).mockReturnValue({ ...baseUI, isPublishModalOpen: true } as never);
    vi.mocked(useAuth).mockReturnValue(baseAuth as never);
    vi.mocked(useEditor).mockReturnValue(baseEditor as never);

    const { queryByTestId } = render(<ModalRenderer {...defaultProps} />);
    await waitFor(() => {
      expect(queryByTestId('publish-modal')).toBeInTheDocument();
    });
  });

  it('renders ImageImportModal when isImageImportModalOpen is true', async () => {
    vi.mocked(useUI).mockReturnValue({ ...baseUI, isImageImportModalOpen: true } as never);
    vi.mocked(useAuth).mockReturnValue(baseAuth as never);
    vi.mocked(useEditor).mockReturnValue(baseEditor as never);

    const { queryByTestId } = render(<ModalRenderer {...defaultProps} />);
    await waitFor(() => {
      expect(queryByTestId('image-import-modal')).toBeInTheDocument();
    });
  });

  it('renders AuditModal when isAuditModalOpen is true', async () => {
    vi.mocked(useUI).mockReturnValue({ ...baseUI, isAuditModalOpen: true } as never);
    vi.mocked(useAuth).mockReturnValue(baseAuth as never);
    vi.mocked(useEditor).mockReturnValue(baseEditor as never);

    const { queryByTestId } = render(<ModalRenderer {...defaultProps} />);
    await waitFor(() => {
      expect(queryByTestId('audit-modal')).toBeInTheDocument();
    });
  });

  it('renders CommandPalette when isCommandPaletteOpen is true', async () => {
    vi.mocked(useUI).mockReturnValue({ ...baseUI, isCommandPaletteOpen: true } as never);
    vi.mocked(useAuth).mockReturnValue(baseAuth as never);
    vi.mocked(useEditor).mockReturnValue(baseEditor as never);

    const { queryByTestId } = render(<ModalRenderer {...defaultProps} />);
    await waitFor(() => {
      expect(queryByTestId('command-palette')).toBeInTheDocument();
    });
  });

  it('renders KeyboardShortcutsModal when isShortcutsModalOpen is true', async () => {
    vi.mocked(useUI).mockReturnValue({ ...baseUI, isShortcutsModalOpen: true } as never);
    vi.mocked(useAuth).mockReturnValue(baseAuth as never);
    vi.mocked(useEditor).mockReturnValue(baseEditor as never);

    const { queryByTestId } = render(<ModalRenderer {...defaultProps} />);
    await waitFor(() => {
      expect(queryByTestId('keyboard-shortcuts-modal')).toBeInTheDocument();
    });
  });

  it('renders PublishPromptModal when isPublishPromptModalOpen is true', async () => {
    vi.mocked(useUI).mockReturnValue({ ...baseUI, isPublishPromptModalOpen: true } as never);
    vi.mocked(useAuth).mockReturnValue(baseAuth as never);
    vi.mocked(useEditor).mockReturnValue(baseEditor as never);

    const { queryByTestId } = render(<ModalRenderer {...defaultProps} />);
    await waitFor(() => {
      expect(queryByTestId('publish-prompt-modal')).toBeInTheDocument();
    });
  });

  it('renders multiple modals when multiple flags are true', async () => {
    vi.mocked(useUI).mockReturnValue({
      ...baseUI,
      isPublishModalOpen: true,
      isAuditModalOpen: true,
    } as never);
    vi.mocked(useAuth).mockReturnValue(baseAuth as never);
    vi.mocked(useEditor).mockReturnValue(baseEditor as never);

    const { queryByTestId } = render(<ModalRenderer {...defaultProps} />);
    await waitFor(() => {
      expect(queryByTestId('publish-modal')).toBeInTheDocument();
      expect(queryByTestId('audit-modal')).toBeInTheDocument();
    });
  });
});
