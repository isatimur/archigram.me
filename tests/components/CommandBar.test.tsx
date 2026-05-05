// tests/components/CommandBar.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Minimal context mocks
vi.mock('@/lib/contexts/UIContext', () => ({
  useUI: () => ({
    viewMode: 'split',
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
    activeProject: { id: '1', name: 'My Diagram' },
    handleRenameProject: vi.fn(),
  }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import CommandBar from '@/components/CommandBar';

const props = {
  onExportPng: vi.fn(),
  onExportSvg: vi.fn(),
  onShare: vi.fn(),
  onPublish: vi.fn(),
  onAudit: vi.fn(),
  onNavigate: vi.fn(),
};

describe('CommandBar', () => {
  it('renders the ArchiGram brand', () => {
    render(<CommandBar {...props} />);
    expect(screen.getByText('Gram')).toBeInTheDocument();
  });

  it('displays the active project name', () => {
    render(<CommandBar {...props} />);
    expect(screen.getByText('My Diagram')).toBeInTheDocument();
  });

  it('switches to edit mode when project title is clicked', () => {
    render(<CommandBar {...props} />);
    fireEvent.click(screen.getByText('My Diagram'));
    expect(screen.getByRole('textbox', { name: /project title/i })).toBeInTheDocument();
  });

  it('cancels title edit on Escape', () => {
    render(<CommandBar {...props} />);
    fireEvent.click(screen.getByText('My Diagram'));
    const input = screen.getByRole('textbox', { name: /project title/i });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
