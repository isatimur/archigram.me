import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils.tsx';
import React from 'react';
import { ViewMode } from '../../types.ts';

vi.mock('../../components/ShareEmailModal.tsx', () => ({
  default: () => null,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/lib/contexts/UIContext', () => ({
  useUI: () => ({
    viewMode: ViewMode.Split,
    setViewMode: vi.fn(),
    theme: 'dark',
    setTheme: vi.fn(),
    activePanel: null,
    isCopilotOpen: false,
  }),
}));
vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, openAuth: vi.fn() }),
}));
vi.mock('@/lib/contexts/EditorContext', () => ({
  useEditor: () => ({
    activeProject: { id: '1', name: 'My API Flow', code: 'graph TD; A-->B', updatedAt: 0 },
    handleRenameProject: vi.fn(),
  }),
}));

import CommandBar from '../../components/CommandBar.tsx';

const defaultProps = {
  onExportPng: vi.fn(),
  onExportSvg: vi.fn(),
  onShare: vi.fn(),
  onPublish: vi.fn(),
  onAudit: vi.fn(),
  onNavigate: vi.fn(),
};

const originalLocation = window.location;

describe('CommandBar embed code generation', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { search: '', hash: '#abc123', href: 'http://localhost/#abc123' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('generated embed code contains mode=toolbar by default', async () => {
    render(<CommandBar {...defaultProps} />);

    const shareBtn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareBtn);

    const embedOption = await screen.findByText(/embed/i);
    fireEvent.click(embedOption);

    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect((textarea as HTMLTextAreaElement).value).toContain('mode=toolbar');
      expect((textarea as HTMLTextAreaElement).value).toContain('<iframe');
    });
  });

  it('Twitter share URL includes the diagram name as title param', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<CommandBar {...defaultProps} />);

    const shareBtn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareBtn);

    const twitterBtn = await screen.findByText(/twitter/i);
    fireEvent.click(twitterBtn);

    expect(openSpy).toHaveBeenCalledOnce();
    const calledUrl = openSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('twitter.com/intent/tweet');
    expect(calledUrl).toContain(encodeURIComponent('@ArchiGram_ai'));
    expect(calledUrl).toContain(encodeURIComponent('My API Flow'));

    openSpy.mockRestore();
  });
});
