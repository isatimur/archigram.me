import { Icon } from '@iconify/react';
import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import CopyDropdown from './CopyDropdown.tsx';
import PlatformGuides from './PlatformGuides.tsx';
import { DiagramTheme } from '../types.ts';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  error?: string | null;
  selectionRequest?: { text: string; ts: number } | null;
  theme?: DiagramTheme;
  hideToolbar?: boolean;
  collapseStatus?: boolean; // Prop to force collapse if no error
  onFixError?: () => void;
  isFixing?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  error,
  selectionRequest,
  theme = 'dark',
  hideToolbar = false,
  collapseStatus = false,
  onFixError,
  isFixing = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  // Default to closed unless there's an error
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [showPlatformGuides, setShowPlatformGuides] = useState(false);

  // Parse error line number
  const errorLine = useMemo(() => {
    if (!error) return null;
    const match = error.match(/line\s+(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }, [error]);

  // Handle external selection request (Search and Jump)
  useEffect(() => {
    if (!selectionRequest || !code || !textareaRef.current) return;

    const searchText = selectionRequest.text;
    const index = code.indexOf(searchText);

    if (index !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(index, index + searchText.length);

      const substring = code.substring(0, index);
      const lineNum = substring.split('\n').length;
      const lineHeight = 24;
      const editorHeight = textareaRef.current.clientHeight;

      const scrollTop = Math.max(0, lineNum * lineHeight - editorHeight / 2);

      textareaRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
      setHighlightedLine(lineNum);

      const timer = setTimeout(() => setHighlightedLine(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [selectionRequest, code]);

  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = scrollTop;
      }
    }
  };

  useEffect(() => {
    if (error) {
      setIsDiagnosticsOpen(true);
    }
  }, [error]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== textareaRef.current) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        onRedo?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo]);

  // Robust Tokenizer using Theme Variables for Consistency
  const highlightCode = useCallback(
    (text: string) => {
      if (!text) return '';

      const isLight = theme === 'neutral';

      const patterns = [
        {
          regex: /(%%.*)/,
          className: isLight
            ? 'text-slate-500 italic opacity-80'
            : 'text-text-muted italic opacity-70',
        }, // Comments
        {
          regex: /("[^"]*")/,
          className: isLight ? 'text-emerald-600 font-medium' : 'text-emerald-400',
        }, // Strings
        {
          regex:
            /\b(sequenceDiagram|classDiagram|graph|flowchart|gantt|erDiagram|pie|stateDiagram|stateDiagram-v2|gitGraph|journey|mindmap|timeline)\b/,
          className: isLight ? 'text-purple-600 font-bold' : 'text-accent font-bold',
        }, // Types -> Accent Color
        {
          regex:
            /\b(participant|actor|class|subgraph|end|note|alt|opt|loop|else|rect|par|and|break|critical|autonumber|activate|deactivate|title|style|linkStyle|classDef)\b/,
          className: isLight ? 'text-blue-600 font-semibold' : 'text-primary font-semibold',
        }, // Keywords -> Primary Color
        {
          regex: /(-->>|-->|---|->|->>|==>|==|-\.->|-\.-)/,
          className: isLight ? 'text-cyan-600 font-bold' : 'text-cyan-400 font-bold',
        }, // Arrows
        {
          regex: /\b(left of|right of|over|TB|TD|BT|RL|LR)\b/,
          className: isLight ? 'text-orange-600' : 'text-orange-400',
        }, // Directions
        {
          regex: /([[\](){}])/,
          className: isLight ? 'text-yellow-600 font-bold' : 'text-yellow-400',
        }, // Brackets & Shapes
      ];

      const combinedSource = patterns.map((p) => p.regex.source).join('|');
      const combinedRegex = new RegExp(combinedSource, 'g');

      let lastIndex = 0;
      let html = '';
      let match;

      while ((match = combinedRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          html += text
            .slice(lastIndex, match.index)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        }

        let matchedGroupIndex = -1;
        for (let i = 1; i < match.length; i++) {
          if (match[i]) {
            matchedGroupIndex = i - 1;
            break;
          }
        }

        const content = match[0].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        if (matchedGroupIndex !== -1 && patterns[matchedGroupIndex]) {
          html += `<span class="${patterns[matchedGroupIndex].className}">${content}</span>`;
        } else {
          html += content;
        }

        lastIndex = combinedRegex.lastIndex;
      }

      if (lastIndex < text.length) {
        html += text
          .slice(lastIndex)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }

      return html;
    },
    [theme]
  );

  // Memoize highlighted code to avoid re-tokenizing on every render
  const highlightedHtml = useMemo(() => highlightCode(code), [code, highlightCode]);

  const lineCount = code.split('\n').length;

  // Logic to determine height: 0 if collapsed and no error, h-8 if has error or not collapsed mode
  const diagnosticsHeight =
    !error && collapseStatus && !isDiagnosticsOpen
      ? 'h-0 border-t-0 overflow-hidden'
      : isDiagnosticsOpen
        ? 'max-h-32 border-t border-border'
        : 'h-8 border-t border-border';

  return (
    <div className="h-full min-h-0 w-full flex flex-col bg-background/95 relative transition-colors duration-300">
      {/* Refined Toolbar */}
      {!hideToolbar && (
        <div className="px-4 py-2 bg-surface/90 border-b border-border flex justify-between items-center shrink-0 h-10 box-border backdrop-blur-sm z-20 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-text-muted group cursor-pointer hover:text-text transition-colors">
              <Icon icon="lucide:file-json" className="w-3.5 h-3.5 text-primary" />
              <span>source.mmd</span>
            </div>
            <CopyDropdown code={code} onOpenGuides={() => setShowPlatformGuides(true)} />
            {(onUndo || onRedo) && (
              <>
                <div className="h-3 w-px bg-border"></div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="p-1 text-text-muted hover:text-text disabled:opacity-30 transition-colors rounded hover:bg-surface-hover"
                    title="Undo (Ctrl+Z)"
                  >
                    <Icon icon="lucide:undo" className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="p-1 text-text-muted hover:text-text disabled:opacity-30 transition-colors rounded hover:bg-surface-hover"
                    title="Redo (Ctrl+Y)"
                  >
                    <Icon icon="lucide:redo" className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="text-[10px] text-text-muted font-mono flex items-center gap-1.5 opacity-70">
            <Icon icon="lucide:terminal" className="w-3 h-3" />
            <span>Mermaid v11.4</span>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex relative overflow-hidden bg-background/95 transition-colors duration-300">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="w-12 h-full pt-4 pb-4 bg-surface/35 border-r border-border text-right select-none overflow-hidden shrink-0 z-10 transition-colors duration-300"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            const lineNum = i + 1;
            const isError = errorLine === lineNum;
            const isHighlighted = highlightedLine === lineNum;
            return (
              <div
                key={i}
                className={`text-sm leading-6 pr-3 font-mono transition-colors duration-200 relative
                            ${isError ? 'text-red-500 font-bold bg-red-500/10' : ''}
                            ${isHighlighted ? 'text-primary font-bold' : !isError && 'text-text-muted/50'}
                        `}
              >
                {isError && (
                  <div className="absolute left-1 top-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                )}
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Code Area Container */}
        <div className="flex-1 min-h-0 relative overflow-hidden group bg-background/95 transition-colors duration-300">
          {/* Highlight Overlay Layer */}
          {highlightedLine !== null && (
            <div
              className="absolute left-0 right-0 bg-primary/20 border-t border-b border-primary/30 pointer-events-none z-0 animate-fade-in"
              style={{
                top: `calc(1rem + ${(highlightedLine - 1) * 1.5}rem - ${textareaRef.current?.scrollTop || 0}px)`,
                height: '1.5rem',
                transition: 'top 0s',
              }}
            />
          )}

          {/* Error Line Highlight Overlay */}
          {errorLine !== null && (
            <div
              className="absolute left-0 right-0 bg-red-500/10 border-t border-b border-red-500/20 pointer-events-none z-0"
              style={{
                top: `calc(1rem + ${(errorLine - 1) * 1.5}rem - ${textareaRef.current?.scrollTop || 0}px)`,
                height: '1.5rem',
                transition: 'top 0s',
              }}
            />
          )}

          {/* Syntax Highlight Layer */}
          <pre
            ref={preRef}
            className="absolute inset-0 p-4 m-0 font-mono text-sm leading-6 pointer-events-none whitespace-pre overflow-hidden text-text transition-colors duration-300"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
            dangerouslySetInnerHTML={{ __html: highlightedHtml + '<br/>' }}
          />

          {/* Input Layer */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent text-sm font-mono leading-6 caret-primary resize-none outline-none whitespace-pre overflow-auto z-10 selection:bg-primary/30 cursor-text scrollbar-thin"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Mermaid diagram source code"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              caretColor: 'rgb(var(--primary))',
            }}
          />
        </div>
      </div>

      {/* Diagnostics Panel */}
      <div
        className={`bg-background transition-all duration-300 ease-in-out flex flex-col z-20 ${diagnosticsHeight}`}
      >
        <div
          className="flex items-center justify-between px-4 h-8 bg-surface cursor-pointer hover:bg-surface-hover transition-colors select-none border-b border-border"
          onClick={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Icon icon="lucide:alert-circle" className="w-3 h-3" />
              Problems
            </span>
            {error ? (
              <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full">
                1 Error
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-text-muted px-1.5 py-0.5">
                0 Errors
              </span>
            )}
          </div>
          <div className="text-text-muted">
            {isDiagnosticsOpen ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            )}
          </div>
        </div>

        {isDiagnosticsOpen && (
          <div className="flex-1 overflow-y-auto p-0 font-mono text-xs">
            {error ? (
              <div className="flex items-center gap-3 p-3 hover:bg-red-500/5 transition-colors group border-l-2 border-red-500">
                <Icon
                  icon="lucide:x-circle"
                  className="w-4 h-4 text-red-500 shrink-0 self-start mt-0.5"
                />
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    if (textareaRef.current && errorLine) {
                      const lineHeight = 24;
                      textareaRef.current.scrollTop = (errorLine - 5) * lineHeight;
                    }
                  }}
                >
                  <p className="text-text group-hover:text-text transition-colors">{error}</p>
                  <p className="text-text-muted mt-1">
                    {errorLine
                      ? `Source: mermaid-parser (Line ${errorLine})`
                      : 'Source: mermaid-parser'}
                  </p>
                </div>
                {onFixError && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFixError();
                    }}
                    disabled={isFixing}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-border text-text hover:bg-primary hover:text-white hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-wait shadow-sm"
                  >
                    {isFixing ? (
                      <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Icon icon="lucide:sparkles" className="w-3.5 h-3.5" />
                    )}
                    <span className="font-bold text-[10px] tracking-wide">
                      {isFixing ? 'Fixing...' : 'Fix with AI'}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[50px] text-text-muted gap-2 opacity-50">
                <Icon icon="lucide:check-circle-2" className="w-6 h-6" />
                <p>No problems detected.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <PlatformGuides isOpen={showPlatformGuides} onClose={() => setShowPlatformGuides(false)} />
    </div>
  );
};

export default CodeEditor;
