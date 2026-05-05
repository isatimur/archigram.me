import { Icon } from '@iconify/react';
import React, { useState, useEffect } from 'react';
import pako from 'pako';
import { AppView, ViewMode } from '../types.ts';
import { toast } from 'sonner';
import CodeEditor from './CodeEditor.tsx';

interface PlantUMLStudioProps {
  onNavigate: (view: AppView) => void;
}

const INITIAL_PLANTUML = `@startuml
!option handwritten true
skinparam monochrome reverse

actor User
participant "First Class" as A
participant "Second Class" as B
participant "Last Class" as C

User -> A: DoWork
activate A

A -> B: Create Request
activate B

B -> C: DoWork
activate C
C --> B: WorkDone
destroy C

B --> A: RequestCreated
deactivate B

A --> User: Done
deactivate A
@enduml`;

// --- PlantUML Encoding Logic (Manual Implementation) ---
function encode6bit(b: number): string {
  if (b < 10) return String.fromCharCode(48 + b);
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
}

function append3bytes(b1: number, b2: number, b3: number): string {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3f;
  let r = '';
  r += encode6bit(c1 & 0x3f);
  r += encode6bit(c2 & 0x3f);
  r += encode6bit(c3 & 0x3f);
  r += encode6bit(c4 & 0x3f);
  return r;
}

function encode64(data: Uint8Array): string {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data[i], data[i + 1], 0);
    } else if (i + 1 === data.length) {
      r += append3bytes(data[i], 0, 0);
    } else {
      r += append3bytes(data[i], data[i + 1], data[i + 2]);
    }
  }
  return r;
}

function encodePlantUML(text: string): string {
  try {
    const utf8Encoder = new TextEncoder();
    const data = utf8Encoder.encode(text);
    // PlantUML expects raw deflate (no zlib headers)
    const compressed = pako.deflateRaw(data, { level: 9 });
    return encode64(compressed);
  } catch (e) {
    console.error('Encoding error', e);
    return '';
  }
}
// ----------------------------------------------------

const PlantUMLStudio: React.FC<PlantUMLStudioProps> = ({ onNavigate }) => {
  const [code, setCode] = useState(INITIAL_PLANTUML);
  const [imageUrl, setImageUrl] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Split);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Server Configuration State - Updated default URL
  const [serverUrl, setServerUrl] = useState('https://plantuml.beyond9to6.com');
  const [showSettings, setShowSettings] = useState(false);

  // Editor History State
  const [history, setHistory] = useState<string[]>([INITIAL_PLANTUML]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Debounced History Update (Matches App.tsx implementation)
  useEffect(() => {
    if (code === history[historyIndex]) return;

    const timeout = setTimeout(() => {
      setHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        return [...upToCurrent, code];
      });
      setHistoryIndex((prev) => prev + 1);
    }, 800);

    return () => clearTimeout(timeout);
  }, [code, historyIndex, history]);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCode(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCode(history[newIndex]);
    }
  };

  // Debounced URL Generation
  useEffect(() => {
    let isMounted = true;

    const generateUrl = async () => {
      try {
        if (isMounted) setLoading(true);

        const encoded = encodePlantUML(code);
        if (encoded) {
          const baseUrl = serverUrl.replace(/\/$/, '');
          const url = `${baseUrl}/svg/${encoded}`;

          if (isMounted) setImageUrl(url);
        }
      } catch (e) {
        console.error('PlantUML Encode Error', e);
      } finally {
        setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 300);
      }
    };

    const timeout = setTimeout(generateUrl, 800);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [code, serverUrl]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (format: 'svg' | 'png' | 'txt' | 'pdf') => {
    const encoded = encodePlantUML(code);
    if (!encoded) return;

    const baseUrl = serverUrl.replace(/\/$/, '');
    const url = `${baseUrl}/${format}/${encoded}`;

    try {
      // For images/pdf we might want to fetch as blob to force download name
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      // Use correct extension for ASCII (txt)
      const ext = format === 'txt' ? 'txt' : format;
      a.download = `diagram-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      toast.error(`Failed to download ${format.toUpperCase()}. Opening in new tab instead.`);
      window.open(url, '_blank');
    }
  };

  const isSelfHosted =
    serverUrl.includes('beyond9to6') ||
    serverUrl.includes('localhost') ||
    serverUrl.includes('127.0.0.1');

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-text font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('landing')}
            className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors"
            title="Back to Home"
          >
            <Icon icon="lucide:arrow-left" className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-text flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-600 flex items-center justify-center text-white text-[10px] font-bold">
                PU
              </div>
              PlantUML Studio
            </h1>
            <span className="text-[10px] text-text-muted flex items-center gap-1">
              Server: {isSelfHosted ? 'Self-Hosted' : 'Public'}
              <div
                className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}
              ></div>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Undo/Redo Controls (Header) */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 text-text-muted hover:text-text disabled:opacity-30 transition-colors rounded hover:bg-surface-hover"
              title="Undo (Ctrl+Z)"
            >
              <Icon icon="lucide:undo" className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-text-muted hover:text-text disabled:opacity-30 transition-colors rounded hover:bg-surface-hover"
              title="Redo (Ctrl+Y)"
            >
              <Icon icon="lucide:redo" className="w-4 h-4" />
            </button>
          </div>

          {/* Server Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-all ${showSettings ? 'bg-surface text-text' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
              title="Server Settings"
              aria-label="Server Settings"
            >
              <Icon icon="lucide:settings" className="w-4 h-4" />
            </button>

            {showSettings && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)}></div>
                <div className="absolute top-full right-0 mt-2 w-72 bg-surface border border-border rounded-xl shadow-2xl z-20 p-4 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-xs font-bold text-text mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Icon icon="lucide:server" className="w-3 h-3" /> Rendering Server
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-text-muted mb-1.5 block">Server URL</label>
                      <input
                        type="text"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-green-500 font-mono"
                        placeholder="https://plantuml.example.com"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setServerUrl('https://plantuml.beyond9to6.com')}
                        className="flex-1 py-1.5 bg-surface-hover border border-border rounded text-[10px] text-text-muted hover:text-text hover:border-green-500/50 transition-colors"
                      >
                        Reset to Default
                      </button>
                      <button
                        onClick={() => setServerUrl('https://www.plantuml.com/plantuml')}
                        className="flex-1 py-1.5 bg-surface-hover border border-border rounded text-[10px] text-text-muted hover:text-text hover:border-blue-500/50 transition-colors flex items-center justify-center gap-1"
                      >
                        <Icon icon="lucide:globe" className="w-3 h-3" /> Public
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-border/50 hidden md:block"></div>

          {/* Copy Button */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-all border border-border hover:border-text-muted/50"
            title="Copy Source Code"
            aria-label="Copy Source Code"
          >
            {copied ? (
              <Icon icon="lucide:check" className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Icon icon="lucide:copy" className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>

          {/* View Toggle */}
          <div className="hidden md:flex items-center bg-surface p-1 rounded-lg border border-border shadow-inner">
            {[
              { mode: ViewMode.Code, icon: 'lucide:code-2', label: 'Code' },
              { mode: ViewMode.Split, icon: 'lucide:columns-2', label: 'Split' },
              { mode: ViewMode.Preview, icon: 'lucide:eye', label: 'Preview' },
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
                  viewMode === mode
                    ? 'bg-background text-text shadow-sm ring-1 ring-border'
                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                }`}
                title={label}
                aria-label={label}
              >
                <Icon icon={icon} className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Export Formats Group */}
          <div className="flex items-center bg-surface border border-border rounded-lg p-1 shadow-sm">
            <button
              onClick={() => handleDownload('svg')}
              className="p-1.5 text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-all"
              title="Export as SVG"
              disabled={!imageUrl}
            >
              <Icon icon="lucide:file-code" className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button
              onClick={() => handleDownload('png')}
              className="p-1.5 text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-all"
              title="Export as PNG"
              disabled={!imageUrl}
            >
              <Icon icon="lucide:image" className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button
              onClick={() => handleDownload('txt')}
              className="p-1.5 text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-all"
              title="Export as ASCII"
              disabled={!imageUrl}
            >
              <Icon icon="lucide:file-text" className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button
              onClick={() => handleDownload('pdf')}
              className="p-1.5 text-text-muted hover:text-text hover:bg-surface-hover rounded-md transition-all"
              title="Export as PDF"
              disabled={!imageUrl}
            >
              <Icon icon="lucide:file-type" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {(viewMode === ViewMode.Split || viewMode === ViewMode.Code) && (
          <div
            className={`flex flex-col transition-all duration-300 border-r border-border ${viewMode === ViewMode.Split ? 'w-1/3' : 'w-full'}`}
          >
            <CodeEditor
              code={code}
              onChange={setCode}
              theme="midnight"
              onUndo={undo}
              onRedo={redo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
            />
          </div>
        )}

        {(viewMode === ViewMode.Split || viewMode === ViewMode.Preview) && (
          <div
            className={`${viewMode === ViewMode.Split ? 'w-2/3' : 'w-full'} bg-surface/50 relative flex items-center justify-center overflow-auto p-10`}
          >
            {loading && (
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-full text-xs text-text-muted z-10 shadow-lg">
                <Icon icon="lucide:loader-2" className="w-3 h-3 animate-spin" />
                Rendering...
              </div>
            )}

            {imageUrl ? (
              <img
                src={imageUrl}
                alt="PlantUML Diagram"
                className="max-w-full max-h-full shadow-2xl rounded bg-transparent"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  toast.error(
                    `Failed to load diagram. Check if the server at ${serverUrl} is running.`
                  );
                }}
              />
            ) : (
              <div className="text-text-muted flex flex-col items-center gap-2">
                <Icon icon="lucide:refresh-cw" className="w-8 h-8 opacity-20" />
                <p>Enter code to generate diagram</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PlantUMLStudio;
