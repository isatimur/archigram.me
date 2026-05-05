import { Icon } from '@iconify/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { DiagramTheme, DiagramStyleConfig, BackgroundPattern } from '../types.ts';

interface DiagramPreviewProps {
  code: string;
  onError: (error: string | null) => void;
  theme: DiagramTheme;
  customStyle?: DiagramStyleConfig;
  onUpdateStyle?: (style: DiagramStyleConfig) => void;
  onElementClick?: (text: string) => void;
  showControls?: boolean;
}

interface TooltipData {
  x: number;
  y: number;
  content: string;
  type: string;
  id?: string;
}

// Preset Configurations
const STYLE_PRESETS: Record<string, DiagramStyleConfig> = {
  Professional: {
    backgroundPattern: 'dots',
    backgroundColor: '#131316',
    backgroundOpacity: 1,
    diagramLook: 'classic',
    lineColor: '#6366f1',
    textColor: '#e4e4e7',
    nodeColor: '#1e1e24',
  },
  Blueprint: {
    backgroundPattern: 'grid',
    backgroundColor: '#1e3a8a', // Deep Blue
    backgroundOpacity: 1,
    diagramLook: 'handDrawn',
    lineColor: '#ffffff',
    textColor: '#ffffff',
    nodeColor: 'rgba(255,255,255,0.1)',
  },
  Cyberpunk: {
    backgroundPattern: 'crossline',
    backgroundColor: '#09090b',
    backgroundOpacity: 1,
    diagramLook: 'classic',
    lineColor: '#00ff9d', // Neon Green
    textColor: '#00ff9d',
    nodeColor: '#000000',
  },
  Paper: {
    backgroundPattern: 'solid',
    backgroundColor: '#f5f5f4', // Warm Grey
    backgroundOpacity: 1,
    diagramLook: 'handDrawn',
    lineColor: '#292524',
    textColor: '#292524',
    nodeColor: '#ffffff',
  },
};

// Pattern mini-preview SVGs for the style panel
const PATTERN_OPTIONS: { key: BackgroundPattern; label: string; svg: React.ReactNode }[] = [
  {
    key: 'solid',
    label: 'Solid',
    svg: (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <rect x="1" y="1" width="12" height="12" rx="1" fill="currentColor" opacity="0.4" />
      </svg>
    ),
  },
  {
    key: 'dots',
    label: 'Dots',
    svg: (
      <svg width="14" height="14" viewBox="0 0 14 14">
        {[3, 7, 11].map((x) =>
          [3, 7, 11].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="currentColor" />
          ))
        )}
      </svg>
    ),
  },
  {
    key: 'grid',
    label: 'Grid',
    svg: (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path
          d="M1 5h12M1 9h12M5 1v12M9 1v12"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity="0.8"
        />
      </svg>
    ),
  },
  {
    key: 'crossline',
    label: 'Cross',
    svg: (
      <svg width="14" height="14" viewBox="0 0 14 14">
        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        <path d="M1 7h12M7 1v12" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      </svg>
    ),
  },
];

const DiagramPreview: React.FC<DiagramPreviewProps> = ({
  code,
  onError,
  theme,
  customStyle,
  onUpdateStyle,
  onElementClick,
  showControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isHoveringElement, setIsHoveringElement] = useState(false);
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // HUD State
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const hasDragged = useRef(false);

  // Default Style Merging
  const defaultStyle = theme === 'neutral' ? STYLE_PRESETS['Paper'] : STYLE_PRESETS['Professional'];
  const activeStyle: DiagramStyleConfig = {
    ...defaultStyle,
    ...customStyle,
  };

  // 0. Lazy Loading Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => setShouldRender(true), 50);
          observer.disconnect();
          return () => clearTimeout(timer);
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // 1. Initialize Icons (Robust Loading with CDN Fallback)
  useEffect(() => {
    const registerIcons = async () => {
      if (iconsLoaded) return;

      try {
        // Helper to load pack either from module (via importmap) or CDN fallback
        const loadPack = async (pkg: string, name: string, fallbackUrl?: string) => {
          try {
            const mod = await import(/* @vite-ignore */ pkg);
            return { name, icons: mod.icons || mod.default?.icons };
          } catch {
            if (fallbackUrl) {
              return { name, loader: () => fetch(fallbackUrl).then((res) => res.json()) };
            }
            return null;
          }
        };

        const loaders = [
          // Logos (General Tech)
          loadPack(
            '@iconify-json/logos',
            'logos',
            'https://esm.sh/@iconify-json/logos@1/icons.json'
          ),
          // Font Awesome
          loadPack(
            '@iconify-json/fa6-regular',
            'fa',
            'https://esm.sh/@iconify-json/fa6-regular@1/icons.json'
          ),
          loadPack(
            '@iconify-json/fa6-solid',
            'fas',
            'https://esm.sh/@iconify-json/fa6-solid@1/icons.json'
          ),
          loadPack(
            '@iconify-json/material-symbols',
            'material',
            'https://esm.sh/@iconify-json/material-symbols@1/icons.json'
          ),
        ];

        const results = await Promise.all(loaders);
        const packs = results.flat().filter((p) => p !== null);

        await mermaid.registerIconPacks(packs);
        setIconsLoaded(true);
      } catch (e) {
        console.error('Failed to register icon packs', e);
        setIconsLoaded(true); // Proceed anyway to avoid blocking render
      }
    };
    registerIcons();
  }, [iconsLoaded]);

  // Detect diagram types that are incompatible with handDrawn look.
  // Memoized so the init effect only re-runs when the detected type changes,
  // not on every keystroke.
  const unsafeForHandDrawn = useMemo(() => {
    if (!code) return false;
    const hasFrontMatter = /^-{3}[\s\S]*?-{3}/.test(code);
    const codeBody = hasFrontMatter ? code.replace(/^-{3}[\s\S]*?-{3}/, '') : code;
    return (
      /^\s*gitGraph/m.test(codeBody) ||
      codeBody.includes('gitGraph') ||
      /^\s*mindmap/m.test(codeBody) ||
      codeBody.includes('mindmap') ||
      /^\s*architecture-beta/m.test(codeBody) ||
      codeBody.includes('architecture-beta')
    );
  }, [code]);

  // 2. Initialize Mermaid Config
  // Depends on theme/style and diagram-type flags — NOT on raw code —
  // so typing doesn't cause a config reset and SVG flash on every keystroke.
  useEffect(() => {
    const MERMAID_THEME_MAP: Record<string, 'dark' | 'forest' | 'neutral' | 'default' | 'base'> = {
      dark: 'dark',
      midnight: 'dark',
      forest: 'forest',
      neutral: 'default',
      ember: 'dark',
      dusk: 'dark',
    };
    const mermaidTheme =
      activeStyle.diagramLook === 'handDrawn'
        ? ('neutral' as const)
        : (MERMAID_THEME_MAP[theme] ?? 'dark');
    const isHandDrawn = activeStyle.diagramLook === 'handDrawn';

    const themeVariables: Record<string, string | undefined> = {
      fontFamily: '"Inter", sans-serif',
      primaryColor: activeStyle.nodeColor,
      primaryBorderColor: activeStyle.lineColor,
      lineColor: activeStyle.lineColor,
      textColor: activeStyle.textColor,
      mainBkg: activeStyle.nodeColor,
      actorBkg: activeStyle.nodeColor,
      actorBorder: activeStyle.lineColor,
      actorTextColor: activeStyle.textColor,
      actorLineColor: activeStyle.lineColor,
      signalColor: activeStyle.lineColor,
      signalTextColor: activeStyle.textColor,
      labelBoxBkgColor: activeStyle.nodeColor,
      labelBoxBorderColor: activeStyle.lineColor,
      // GitGraph Specifics
      git0: activeStyle.lineColor || '#6366f1',
      git1: activeStyle.textColor || '#e4e4e7',
      git2: activeStyle.nodeColor || '#1e1e24',
      gitBranchLabel0: activeStyle.textColor,
      gitBranchLabel1: activeStyle.textColor,
    };

    const look: 'classic' | 'handDrawn' = unsafeForHandDrawn
      ? 'classic'
      : isHandDrawn
        ? 'handDrawn'
        : 'classic';
    const curve = isHandDrawn && !unsafeForHandDrawn ? ('linear' as const) : ('basis' as const);

    const config = {
      startOnLoad: false,
      theme: mermaidTheme,
      securityLevel: 'loose' as const,
      fontFamily: '"Inter", sans-serif',
      themeVariables: themeVariables,
      sequence: { showSequenceNumbers: false, actorMargin: 50, useMaxWidth: true },
      look,
      flowchart: { htmlLabels: true, curve },
    };

    try {
      mermaid.initialize(config);
      setSvgContent('');
    } catch (e) {
      console.warn('Mermaid init failed', e);
    }
  }, [
    theme,
    activeStyle.nodeColor,
    activeStyle.lineColor,
    activeStyle.textColor,
    activeStyle.diagramLook,
    unsafeForHandDrawn,
  ]);

  // 3. Render Diagram
  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!code || !iconsLoaded || !shouldRender) return;

      try {
        if (!(await mermaid.parse(code))) {
          throw new Error('Invalid Syntax');
        }

        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);

        if (isMounted) {
          let processedSvg = svg;
          if (activeStyle.diagramLook === 'classic' && activeStyle.lineColor === '#00ff9d') {
            processedSvg = svg.replace(
              /<style>/,
              `<style>.edgePath .path { filter: drop-shadow(0 0 2px ${activeStyle.lineColor}); } `
            );
          }
          setSvgContent(processedSvg);
          onError(null);
        }
      } catch (err) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Syntax Error';
          if (
            msg.includes("reading 'decision'") ||
            msg.includes('undefined') ||
            msg.includes('Cannot read properties')
          ) {
            console.warn('Mermaid Render Error:', msg);
            onError('Rendering Engine Issue: Try simplifying the diagram or checking syntax.');
          } else {
            const mermaidErr = err as Record<string, unknown>;
            const textMatch = typeof mermaidErr?.str === 'string' ? mermaidErr.str : msg;
            onError(textMatch);
          }
        }
      }
    };

    const renderTimer = setTimeout(renderDiagram, 100);
    return () => {
      isMounted = false;
      clearTimeout(renderTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    code,
    iconsLoaded,
    activeStyle.diagramLook,
    activeStyle.lineColor,
    activeStyle.nodeColor,
    activeStyle.textColor,
    theme,
    shouldRender,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
    setTooltip(null);
    hasDragged.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      hasDragged.current = true;
      setPosition({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }
    const target = e.target as Element;
    const group = target.closest('.node, .actor, .messageText, .classTitle, .cluster');
    if (group) {
      setIsHoveringElement(true);
      const content = group.textContent?.trim() || '';
      if (content) {
        setTooltip({ x: e.clientX, y: e.clientY, content, type: 'Element' });
      }
    } else {
      setTooltip(null);
      setIsHoveringElement(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (showControls || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();

      const delta = -e.deltaY * 0.001;
      const newScale = Math.min(Math.max(0.2, scale + delta), 5);
      setScale(newScale);
    }
  };

  const handleMouseUp = () => setIsPanning(false);
  const handleMouseLeave = () => {
    setIsPanning(false);
    setTooltip(null);
    setIsHoveringElement(false);
  };
  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current || !onElementClick) return;
    const target = e.target as Element;
    const group = target.closest('.node, .actor, .messageText');
    if (group) onElementClick(group.textContent?.trim() || '');
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const getBackgroundStyle = () => {
    const bg = activeStyle.backgroundColor || '#131316';
    const opacity = activeStyle.backgroundOpacity ?? 1;
    const color =
      activeStyle.lineColor === '#ffffff' || activeStyle.lineColor === '#e4e4e7'
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(99,102,241,0.05)';

    const baseStyle: React.CSSProperties = {
      backgroundColor: bg,
      opacity: opacity,
    };

    if (activeStyle.backgroundPattern === 'dots') {
      return {
        ...baseStyle,
        backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      };
    } else if (activeStyle.backgroundPattern === 'grid') {
      return {
        ...baseStyle,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      };
    } else if (activeStyle.backgroundPattern === 'crossline') {
      return {
        ...baseStyle,
        backgroundImage: `
                  linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%, ${color}),
                  linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%, ${color})
              `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
      };
    }
    return baseStyle;
  };

  const updateStyle = (
    key: keyof DiagramStyleConfig,
    value: DiagramStyleConfig[keyof DiagramStyleConfig]
  ) => {
    if (onUpdateStyle) {
      onUpdateStyle({ ...activeStyle, [key]: value });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col select-none group/canvas bg-background">
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-all duration-500 ease-in-out"
        style={getBackgroundStyle()}
      >
        {/* Subtle Ambient Spotlight for 'wow' effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      </div>
      <div
        className={`flex-1 overflow-hidden relative z-10 ${isPanning ? 'cursor-grabbing' : isHoveringElement ? 'cursor-pointer' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onClick={handleClick}
      >
        <div
          id="diagram-output-container"
          ref={containerRef}
          className="absolute origin-center transition-transform duration-75 ease-linear will-change-transform"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            minWidth: '100%',
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '100px',
            filter: activeStyle.diagramLook === 'handDrawn' ? 'contrast(1.1) sepia(0.1)' : 'none',
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
        {!svgContent && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 select-none">
            {/* Animated architecture graph */}
            <svg width="180" height="120" viewBox="0 0 180 120" fill="none" className="opacity-70">
              {/* Edges */}
              <line
                x1="90"
                y1="20"
                x2="40"
                y2="70"
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="80"
                strokeDashoffset="80"
                opacity="0"
                style={{ animation: 'edgeDraw 1s 0.2s ease-out forwards' }}
              />
              <line
                x1="90"
                y1="20"
                x2="140"
                y2="70"
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="80"
                strokeDashoffset="80"
                opacity="0"
                style={{ animation: 'edgeDraw 1s 0.3s ease-out forwards' }}
              />
              <line
                x1="40"
                y1="70"
                x2="90"
                y2="105"
                stroke="#c484f9"
                strokeWidth="1.5"
                strokeDasharray="60"
                strokeDashoffset="60"
                opacity="0"
                style={{ animation: 'edgeDraw 1s 0.7s ease-out forwards' }}
              />
              <line
                x1="140"
                y1="70"
                x2="90"
                y2="105"
                stroke="#c484f9"
                strokeWidth="1.5"
                strokeDasharray="60"
                strokeDashoffset="60"
                opacity="0"
                style={{ animation: 'edgeDraw 1s 0.8s ease-out forwards' }}
              />
              {/* Nodes */}
              <rect
                x="72"
                y="6"
                width="36"
                height="28"
                rx="6"
                fill="#18182a"
                stroke="#818cf8"
                strokeWidth="1.5"
                opacity="0"
                style={{ animation: 'nodeAppear 0.5s 0s cubic-bezier(0.16,1,0.3,1) forwards' }}
              />
              <text
                x="90"
                y="24"
                textAnchor="middle"
                fill="#818cf8"
                fontSize="9"
                fontFamily="monospace"
                opacity="0"
                style={{ animation: 'labelFade 0.4s 0.15s ease-out forwards' }}
              >
                API
              </text>
              <rect
                x="18"
                y="56"
                width="44"
                height="28"
                rx="6"
                fill="#18182a"
                stroke="#22d3ee"
                strokeWidth="1.5"
                opacity="0"
                style={{ animation: 'nodeAppear 0.5s 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}
              />
              <text
                x="40"
                y="74"
                textAnchor="middle"
                fill="#22d3ee"
                fontSize="9"
                fontFamily="monospace"
                opacity="0"
                style={{ animation: 'labelFade 0.4s 0.55s ease-out forwards' }}
              >
                Cache
              </text>
              <rect
                x="118"
                y="56"
                width="44"
                height="28"
                rx="6"
                fill="#18182a"
                stroke="#22d3ee"
                strokeWidth="1.5"
                opacity="0"
                style={{ animation: 'nodeAppear 0.5s 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}
              />
              <text
                x="140"
                y="74"
                textAnchor="middle"
                fill="#22d3ee"
                fontSize="9"
                fontFamily="monospace"
                opacity="0"
                style={{ animation: 'labelFade 0.4s 0.65s ease-out forwards' }}
              >
                DB
              </text>
              {/* Bottom diamond node with pulse */}
              <polygon
                points="90,91 102,103 90,115 78,103"
                fill="#18182a"
                stroke="#c484f9"
                strokeWidth="1.5"
                opacity="0"
                style={{
                  animation:
                    'nodeAppear 0.5s 0.9s cubic-bezier(0.16,1,0.3,1) forwards, diamondPulse 2.5s 1.5s ease-in-out infinite',
                }}
              />
            </svg>
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-muted/40">
              {shouldRender ? 'Rendering…' : 'Write a diagram'}
            </p>
          </div>
        )}
      </div>

      {showControls && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
          {showStyleMenu && onUpdateStyle && (
            <div
              className="backdrop-blur-xl rounded-2xl mb-2 w-72 animate-slide-up overflow-hidden"
              style={{
                background: 'rgb(var(--surface) / 0.96)',
                border: '1px solid rgb(var(--border) / 0.8)',
                boxShadow: '0 0 0 1px rgb(var(--border) / 0.35), 0 32px 64px rgb(0 0 0 / 0.28)',
              }}
            >
              {/* Cyan accent top rule */}
              <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

              <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400/70 flex items-center gap-1.5">
                    <Icon icon="lucide:palette" className="w-3 h-3" /> Style Studio
                  </span>
                  <button
                    onClick={() => setShowStyleMenu(false)}
                    className="text-text-muted hover:text-text transition-colors"
                    title="Hide panel"
                  >
                    <Icon icon="lucide:eye" className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-0.5">
                  {/* Presets */}
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim mb-2 block">
                      Presets
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.entries(STYLE_PRESETS) as [string, DiagramStyleConfig][]).map(
                        ([preset, config]) => {
                          const isActive = JSON.stringify(activeStyle) === JSON.stringify(config);
                          return (
                            <button
                              key={preset}
                              onClick={() => onUpdateStyle(config)}
                              className={`relative px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all border ${
                                isActive
                                  ? 'border-cyan-400/30 text-white'
                                  : 'border-border text-text-muted hover:border-primary/30 hover:text-text'
                              }`}
                              style={
                                isActive
                                  ? {
                                      background: 'rgba(34,211,238,0.06)',
                                      boxShadow: '0 0 14px rgba(34,211,238,0.1)',
                                    }
                                  : { background: 'rgb(var(--bg) / 0.3)' }
                              }
                            >
                              {/* Mini palette dots */}
                              <div className="flex gap-0.5 mb-1.5">
                                <span
                                  className="w-2 h-2 rounded-full border border-border"
                                  style={{ backgroundColor: config.nodeColor ?? '#000' }}
                                />
                                <span
                                  className="w-2 h-2 rounded-full border border-border"
                                  style={{ backgroundColor: config.lineColor ?? '#000' }}
                                />
                                <span
                                  className="w-2 h-2 rounded-full border border-border"
                                  style={{ backgroundColor: config.textColor ?? '#fff' }}
                                />
                              </div>
                              <span>{preset}</span>
                              {isActive && (
                                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Custom Colors */}
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim mb-2 block">
                      Colors
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          {
                            key: 'nodeColor' as const,
                            label: 'Node',
                            value: activeStyle.nodeColor ?? '#000000',
                          },
                          {
                            key: 'lineColor' as const,
                            label: 'Line',
                            value: activeStyle.lineColor ?? '#000000',
                          },
                          {
                            key: 'textColor' as const,
                            label: 'Text',
                            value: activeStyle.textColor ?? '#ffffff',
                          },
                          {
                            key: 'backgroundColor' as const,
                            label: 'Canvas',
                            value: activeStyle.backgroundColor ?? '#000000',
                          },
                        ] as { key: keyof DiagramStyleConfig; label: string; value: string }[]
                      ).map(({ key, label, value }) => (
                        <label
                          key={key}
                          className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-border cursor-pointer hover:border-primary/30 transition-colors group"
                          style={{ background: 'rgb(var(--bg) / 0.35)' }}
                        >
                          <span className="font-mono text-[10px] text-text-muted group-hover:text-text transition-colors">
                            {label}
                          </span>
                          <div className="relative flex items-center">
                            <div
                              className="w-5 h-5 rounded border border-border shadow-inner"
                              style={{ backgroundColor: value }}
                            />
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => updateStyle(key, e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Render Mode */}
                  <div>
                    <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim mb-2 block">
                      Render
                    </label>
                    <div
                      className="flex rounded-lg p-0.5 border border-border"
                      style={{ background: 'rgb(var(--bg) / 0.45)' }}
                    >
                      {[
                        { value: 'classic', label: 'Classic' },
                        { value: 'handDrawn', label: 'Sketch' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updateStyle('diagramLook', value)}
                          className={`flex-1 py-1.5 rounded-md font-mono text-[10px] font-medium transition-all ${
                            activeStyle.diagramLook === value
                              ? 'text-text border border-border shadow-sm'
                              : 'text-text-muted hover:text-text'
                          }`}
                          style={
                            activeStyle.diagramLook === value
                              ? { background: 'rgb(var(--surface-hover) / 0.8)' }
                              : {}
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pattern */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim block">
                        Pattern
                      </label>
                      <span className="font-mono text-[9px] text-text-dim">
                        {Math.round((activeStyle.backgroundOpacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <div className="flex gap-1.5 mb-2.5">
                      {PATTERN_OPTIONS.map(({ key, label, svg }) => (
                        <button
                          key={key}
                          onClick={() => updateStyle('backgroundPattern', key)}
                          className={`flex-1 h-8 rounded-lg border flex items-center justify-center transition-all ${
                            activeStyle.backgroundPattern === key
                              ? 'border-cyan-400/35 text-cyan-400'
                              : 'border-border text-text-muted hover:border-primary/30 hover:text-text'
                          }`}
                          style={
                            activeStyle.backgroundPattern === key
                              ? { background: 'rgba(34,211,238,0.06)' }
                              : { background: 'rgb(var(--bg) / 0.35)' }
                          }
                          title={label}
                        >
                          {svg}
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={activeStyle.backgroundOpacity ?? 1}
                      onChange={(e) => updateStyle('backgroundOpacity', parseFloat(e.target.value))}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer accent-cyan-400"
                      style={{ background: 'rgb(var(--border) / 0.5)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-0.5 bg-surface/95 backdrop-blur-xl border border-border/80 rounded-full px-2 py-1.5 shadow-hud">
            {onUpdateStyle && (
              <>
                <button
                  onClick={() => setShowStyleMenu(!showStyleMenu)}
                  className={`p-1.5 rounded-full transition-colors ${showStyleMenu ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`}
                  title="Style Studio"
                  aria-label="Open Style Studio"
                >
                  <Icon icon="lucide:palette" className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-border/60 mx-1.5" />
              </>
            )}
            <button
              onClick={() => setScale((s) => Math.max(s - 0.25, 0.2))}
              className="w-7 h-7 flex items-center justify-center hover:bg-surface-hover rounded-full text-text-muted hover:text-text transition-colors"
              title="Zoom Out (−25%)"
              aria-label="Zoom out"
            >
              <Icon icon="lucide:zoom-out" className="w-3.5 h-3.5" />
            </button>
            <button
              className="px-2 min-w-[3rem] h-7 text-center text-[11px] font-mono text-text font-semibold cursor-pointer hover:bg-surface-hover rounded-full select-none transition-colors"
              onClick={resetView}
              title="Reset zoom to 100%"
              aria-label={`Zoom ${Math.round(scale * 100)}%, click to reset`}
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={() => setScale((s) => Math.min(s + 0.25, 5))}
              className="w-7 h-7 flex items-center justify-center hover:bg-surface-hover rounded-full text-text-muted hover:text-text transition-colors"
              title="Zoom In (+25%)"
              aria-label="Zoom in"
            >
              <Icon icon="lucide:zoom-in" className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-border/60 mx-1.5" />
            <button
              onClick={resetView}
              className="w-7 h-7 flex items-center justify-center hover:bg-surface-hover rounded-full text-text-muted hover:text-text transition-colors"
              title="Fit to view"
              aria-label="Reset view"
            >
              <Icon icon="lucide:maximize-2" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 bg-surface/95 border border-border text-text rounded-lg shadow-xl backdrop-blur-md pointer-events-none animate-fade-in"
          style={{ left: tooltip.x + 15, top: tooltip.y + 15, maxWidth: '250px' }}
        >
          <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider mb-0.5">
            {tooltip.type}
          </div>
          <div className="text-xs font-medium">{tooltip.content}</div>
        </div>
      )}
    </div>
  );
};

export default DiagramPreview;
