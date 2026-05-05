import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from './utils/test-utils.tsx';
import App from '../App.tsx';

// Mock EmbedView so we don't need to render the full embed
vi.mock('../components/EmbedView.tsx', () => ({
  default: () => <div data-testid="embed-view">EmbedView</div>,
}));

// Mock other heavy components to keep the test fast
vi.mock('../components/LandingPage.tsx', () => ({
  default: () => <div data-testid="landing">Landing</div>,
}));

// Stub retired components (deleted in editor-redesign; App.tsx is legacy Phase 1)
vi.mock('../components/Header.tsx', () => ({ default: () => null }));
vi.mock('../components/AIChat.tsx', () => ({ default: () => null }));
vi.mock('../components/Sidebar.tsx', () => ({ default: () => null }));

describe('App embed detection', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?embed=true&mode=toolbar',
        hash: '#abc',
        href: 'http://localhost/?embed=true&mode=toolbar#abc',
        pathname: '/',
      },
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

  it('renders EmbedView when ?embed=true is present', async () => {
    const { findByTestId } = render(<App />);
    expect(await findByTestId('embed-view')).toBeInTheDocument();
  });
});
