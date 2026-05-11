import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface LibraryDiagramRendererProps {
  code: string;
  /** Pre-rendered SVG from the ingest pipeline. If provided, used as the initial paint. */
  prerenderedSvg?: string;
  /** Used to namespace the mermaid render id so multiple renderers on a page do not collide. */
  id: string;
  className?: string;
}

let mermaidInitialized = false;
function ensureMermaidInit() {
  if (mermaidInitialized) return;
  mermaidInitialized = true;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    fontFamily: 'inherit',
    flowchart: { useMaxWidth: true, htmlLabels: true },
    sequence: { useMaxWidth: true },
    er: { useMaxWidth: true },
    state: { useMaxWidth: true },
  });
}

const LibraryDiagramRenderer: React.FC<LibraryDiagramRendererProps> = ({
  code,
  prerenderedSvg,
  id,
  className,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>(prerenderedSvg ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureMermaidInit();
    (async () => {
      try {
        const renderId = `library-${id}-${Date.now()}`;
        const out = await mermaid.render(renderId, code);
        if (!cancelled) {
          setSvg(out.svg);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to render diagram');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error && !svg) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-rose-500/40 bg-rose-950/20 p-6 text-sm text-rose-200 ${className ?? ''}`}
      >
        Failed to render diagram: {error}
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`mermaid-render w-full overflow-auto ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default LibraryDiagramRenderer;
