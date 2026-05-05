import { Icon } from '@iconify/react';
import React, { useState, useEffect, useRef, memo } from 'react';
import CodeEditor from './CodeEditor.tsx';
import DiagramPreview from './DiagramPreview.tsx';

interface LiveDiagramBlockProps {
  initialCode: string;
  title?: string;
  height?: string;
  className?: string;
  enableZoom?: boolean;
}

const LiveDiagramBlock: React.FC<LiveDiagramBlockProps> = ({
  initialCode,
  title = 'Interactive Preview',
  height = '450px',
  className = '',
  enableZoom = true,
}) => {
  const [editorCode, setEditorCode] = useState(initialCode);
  const [previewCode, setPreviewCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer to lazy load the entire block content
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Debounce preview updates to prevent render lag while typing
  useEffect(() => {
    // Clear previous errors immediately on edit for better UX
    setError((prev) => (prev ? null : prev));

    const timer = setTimeout(() => {
      setPreviewCode(editorCode);
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [editorCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editorCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden border border-white/10 bg-[#09090b] shadow-2xl flex flex-col ${className}`}
      style={{ height }}
    >
      {/* Window Header */}
      <div className="h-9 bg-[#18181b] border-b border-white/5 flex items-center justify-between px-4 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 group">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50 group-hover:bg-red-500 transition-colors"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50 group-hover:bg-yellow-500 transition-colors"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 group-hover:bg-emerald-500 transition-colors"></div>
          </div>
          {title && (
            <span className="ml-3 text-xs font-medium text-zinc-500 font-mono tracking-tight">
              {title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {enableZoom && (
            <span className="text-[10px] text-zinc-600 font-mono hidden md:inline">
              {isVisible ? 'Zoom & Pan Enabled' : 'Loading...'}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="text-xs font-medium text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors group"
          >
            {copied ? (
              <Icon icon="lucide:check" className="w-3 h-3 text-emerald-500" />
            ) : (
              <Icon icon="lucide:copy" className="w-3 h-3 group-hover:text-primary" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Split Pane Body */}
      {isVisible ? (
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Editor Pane */}
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-white/5 relative bg-[#09090b]">
            <CodeEditor
              code={editorCode}
              onChange={setEditorCode}
              error={error}
              theme="midnight"
              hideToolbar={true}
              collapseStatus={true}
            />
            <div className="absolute top-0 right-0 p-2 pointer-events-none">
              <span className="text-[10px] text-zinc-700 font-mono">EDITABLE</span>
            </div>
          </div>

          {/* Preview Pane */}
          <div className="w-full md:w-1/2 bg-[#0d0d10] relative group">
            <DiagramPreview
              code={previewCode}
              onError={setError}
              theme="midnight"
              showControls={enableZoom}
              customStyle={{ backgroundPattern: 'dots', backgroundColor: '#0d0d10' }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-800 bg-[#09090b]">
          <div className="flex flex-col items-center gap-3">
            <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin opacity-20" />
            <span className="text-xs font-mono opacity-20">Initializing Preview...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(LiveDiagramBlock);
