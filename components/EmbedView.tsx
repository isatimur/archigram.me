import { Icon } from '@iconify/react';
import React, { Suspense, lazy, useState } from 'react';
import { decodeCodeFromUrl } from '../utils/url.ts';
import type { EmbedMode } from '../types.ts';

const DiagramPreview = lazy(() => import('./DiagramPreview.tsx'));

const EmbedView: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const rawMode = params.get('mode') ?? 'toolbar';
  const mode: EmbedMode =
    rawMode === 'minimal' || rawMode === 'toolbar' || rawMode === 'interactive'
      ? rawMode
      : 'toolbar';

  const hash = window.location.hash.slice(1);
  const code = hash ? decodeCodeFromUrl(hash) : null;

  const [scale, setScale] = useState(1);

  const appBase = window.location.href.split('?')[0].split('#')[0].replace(/\/$/, '');
  const forkUrl = `${appBase}/#${hash}`;

  if (!code) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-zinc-500 text-sm">
        No diagram — open a share link to embed.
      </div>
    );
  }

  const showToolbar = mode === 'toolbar' || mode === 'interactive';
  const showFork = mode === 'interactive';

  return (
    <div className="h-screen w-screen bg-[#09090b] relative overflow-hidden">
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${100 / scale}%`,
          height: `${100 / scale}%`,
        }}
      >
        <Suspense fallback={null}>
          <DiagramPreview code={code} onError={() => {}} theme="dark" showControls={false} />
        </Suspense>
      </div>

      {showToolbar && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-full px-3 py-1.5 shadow-xl">
          <button
            aria-label="Zoom out"
            onClick={() => setScale((s) => Math.max(0.25, +(s - 0.25).toFixed(2)))}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <Icon icon="lucide:zoom-out" className="w-4 h-4" />
          </button>
          <button
            aria-label="Reset zoom"
            onClick={() => setScale(1)}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <Icon icon="lucide:rotate-ccw" className="w-4 h-4" />
          </button>
          <button
            aria-label="Zoom in"
            onClick={() => setScale((s) => Math.min(3, +(s + 0.25).toFixed(2)))}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            <Icon icon="lucide:zoom-in" className="w-4 h-4" />
          </button>

          {showFork && (
            <>
              <div className="w-px h-4 bg-zinc-700 mx-1" />
              <a
                href={forkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Fork this diagram
                <Icon icon="lucide:external-link" className="w-3 h-3" />
              </a>
            </>
          )}

          <div className="w-px h-4 bg-zinc-700 mx-1" />
          <a
            href={appBase}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors whitespace-nowrap"
          >
            Made with ArchiGram.ai
          </a>
        </div>
      )}
    </div>
  );
};

export default EmbedView;
