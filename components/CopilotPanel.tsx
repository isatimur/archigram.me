import { Icon } from '@iconify/react';
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CopilotDomain, ProjectVersion } from '../types.ts';
import { useUI } from '@/lib/contexts/UIContext';

type CopilotPanelProps = {
  projectId: string;
  currentCode: string;
  onCodeUpdate: (code: string) => void;
  versions: ProjectVersion[];
  onRestoreVersion: (version: ProjectVersion) => void;
  onSaveVersion: (label: string) => void;
  onSharePrompt?: (promptText: string, resultCode?: string) => void;
  externalPrompt?: string;
  externalResultCode?: string;
  onConsumeExternalPrompt?: () => void;
};

const DOMAINS: CopilotDomain[] = ['General', 'Healthcare', 'Finance', 'E-commerce'];

const SUGGESTED_PROMPTS = [
  'Add a validation step',
  'Deploy to Kubernetes',
  'Add an encryption layer',
  'Connect to Data Lake',
];

const CopilotPanel: React.FC<CopilotPanelProps> = ({
  projectId,
  currentCode,
  onCodeUpdate,
  versions,
  onRestoreVersion,
  onSaveVersion,
  onSharePrompt,
  externalPrompt,
  externalResultCode,
  onConsumeExternalPrompt,
}) => {
  const { setIsCopilotOpen } = useUI();

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [justCopied, setJustCopied] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<CopilotDomain>('General');
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);

  // Project-Specific Message Handling
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load chat for specific project
  useEffect(() => {
    const key = `archigram_chat_${projectId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [projectId]);

  // Save chat for specific project
  useEffect(() => {
    if (projectId) {
      localStorage.setItem(`archigram_chat_${projectId}`, JSON.stringify(messages));
    }
  }, [messages, projectId]);

  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab, isLoading]);

  // Consume external prompt from "Try It" in Prompt Marketplace
  useEffect(() => {
    if (!externalPrompt) return;
    // If result code is provided, render it immediately
    if (externalResultCode) {
      onCodeUpdate(externalResultCode);
    }
    // Auto-submit the prompt text
    handleSubmit(externalPrompt);
    onConsumeExternalPrompt?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPrompt]);

  const processAIRequest = async (userPrompt: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setActiveTab('chat');

    try {
      const res = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, currentCode, domain: selectedDomain }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Generation failed');
      const { code: newCode } = await res.json();

      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `I have updated the pipeline for the ${selectedDomain} domain.`,
        codeSnapshot: newCode,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      onCodeUpdate(newCode);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: 'Failed to update diagram. Please try again.',
        isError: true,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Abort in-flight request on unmount
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const textToProcess = typeof e === 'string' ? e : prompt;

    if (!textToProcess.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToProcess.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');

    await processAIRequest(userMsg.text);
  };

  const handleRegenerate = async () => {
    if (isLoading) return;
    const reversedMessages = [...messages].reverse();
    const lastUserMessage = reversedMessages.find((m) => m.role === 'user');

    if (!lastUserMessage) return;

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'model') {
        return prev.slice(0, -1);
      }
      return prev;
    });

    await processAIRequest(lastUserMessage.text);
  };

  const handleFeedback = (msgId: string, type: 'helpful' | 'unhelpful') => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, feedback: type } : m)));
    // In a real implementation, this would send an event to the backend analytics
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setJustCopied(id);
    setTimeout(() => setJustCopied(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirmingClear) {
      setMessages([]);
      localStorage.removeItem(`archigram_chat_${projectId}`);
      setConfirmingClear(false);
    } else {
      setConfirmingClear(true);
      setTimeout(() => setConfirmingClear(false), 3000);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const canRegenerate = !isLoading && lastMessage?.role === 'model';

  return (
    <div className="w-80 glass-panel border-l border-border/70 flex flex-col h-full shrink-0 font-sans relative overflow-hidden">
      {/* Indigo ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none z-0" />

      {/* Panel Header */}
      <div className="h-11 flex items-center gap-2 px-3 border-b border-border/70 shrink-0 relative z-10">
        {/* Title */}
        <div className="flex items-center gap-2 mr-auto">
          <Icon icon="lucide:sparkles" className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-text">AI Copilot</span>
        </div>

        {/* Tabs inline in header */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`text-xs px-2.5 py-1 transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === 'chat'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <Icon icon="lucide:message-square" className="w-3 h-3" />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`text-xs px-2.5 py-1 transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
          >
            <Icon icon="lucide:history" className="w-3 h-3" />
            History
            <span className="bg-surface-hover border border-border text-text-muted px-1 rounded-full text-[9px] font-mono">
              {versions.length}
            </span>
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsCopilotOpen(false)}
          className="text-text-muted hover:text-text transition-colors p-1 hover:bg-surface-hover rounded-md ml-1"
          title="Close Copilot"
          aria-label="Close AI Copilot"
        >
          <Icon icon="lucide:x" className="w-4 h-4" />
        </button>
      </div>

      {/* Domain Selector */}
      <div className="px-3 py-2 border-b border-border/70 shrink-0 relative z-10">
        <div className="relative">
          <button
            onClick={() => setShowDomainDropdown(!showDomainDropdown)}
            className="text-[10px] text-text-muted font-mono uppercase tracking-wider flex items-center gap-1 hover:text-text transition-colors"
          >
            <Icon icon="lucide:bot" className="w-3 h-3 text-primary" />
            Domain: {selectedDomain}
            <Icon icon="lucide:chevron-down" className="w-3 h-3" />
          </button>

          {showDomainDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDomainDropdown(false)}
              ></div>
              <div className="absolute top-full left-0 mt-1 w-36 rounded-lg shadow-md bg-surface border border-border z-20 py-1">
                {DOMAINS.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDomain(d);
                      setShowDomainDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover ${selectedDomain === d ? 'text-primary font-bold' : 'text-text-muted'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-background/25 relative z-10 flex flex-col min-h-0">
        {/* --- TAB: CHAT --- */}
        {activeTab === 'chat' &&
          (messages.length === 0 ? (
            /* Empty state — flex-1 so it fills the Content Area height */
            <div className="flex-1 flex flex-col p-4 min-h-0">
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-muted text-xs">
                {/* Floating orb with orbiting particle */}
                <div
                  className="relative w-20 h-20 flex items-center justify-center"
                  style={{ animation: 'float 4s ease-in-out infinite' }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, rgb(var(--accent)/0.25) 0%, transparent 70%)',
                      animation: 'glowPulse 2s ease-in-out infinite',
                    }}
                  />
                  <div
                    className="w-14 h-14 rounded-full border border-accent/30 flex items-center justify-center"
                    style={{
                      background:
                        'radial-gradient(circle at 35% 35%, rgb(var(--accent)/0.3), rgb(var(--primary)/0.15) 60%, transparent)',
                    }}
                  >
                    <Icon icon="lucide:sparkles" className="w-6 h-6 text-accent/70" />
                  </div>
                  <div
                    className="absolute w-2.5 h-2.5 rounded-full bg-primary/80 shadow-[0_0_6px_rgb(var(--primary)/0.8)]"
                    style={{
                      top: 'calc(50% - 5px)',
                      left: 'calc(50% - 5px)',
                      animation: 'orbit 4s linear infinite',
                    }}
                  />
                </div>
                <p className="text-center text-text-muted/70">
                  Describe your system or architecture.
                </p>
                <span className="px-2 py-1 bg-surface border border-border rounded text-[10px] text-text-muted/60">
                  Domain: {selectedDomain}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((txt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(txt)}
                    className="px-3 py-2 text-left bg-surface border border-border hover:border-primary/50 hover:bg-surface-hover rounded-md text-[10px] text-text-muted hover:text-text transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages list — scrollable */
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1.5 max-w-[90%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  <div
                    className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider ${msg.role === 'user' ? 'text-primary flex-row-reverse' : 'text-text-muted'}`}
                  >
                    <span>{msg.role === 'user' ? 'You' : 'ArchiGram.ai'}</span>
                  </div>

                  <div
                    className={`
                      p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words max-w-full
                      ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20'
                          : msg.isError
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20 rounded-bl-sm'
                            : 'bg-surface border border-border text-text rounded-bl-sm'
                      }
                    `}
                  >
                    {msg.text}

                    {msg.codeSnapshot && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-border bg-background shadow-xl">
                        <div className="flex justify-between items-center px-3 py-1.5 bg-surface-hover border-b border-border">
                          <span className="text-[10px] font-mono text-text-muted tracking-wider uppercase">
                            Suggestion
                          </span>
                          <button
                            onClick={() => handleCopyCode(msg.codeSnapshot ?? '', msg.id)}
                            className="text-[10px] bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 px-2 py-1 rounded transition-colors"
                            title="Apply suggestion"
                          >
                            {justCopied === msg.id ? (
                              <Icon icon="lucide:check" className="w-3 h-3 inline" />
                            ) : (
                              'Apply'
                            )}
                          </button>
                        </div>
                        <div className="p-3 overflow-x-auto">
                          <pre className="text-xs font-mono text-primary whitespace-pre-wrap leading-relaxed">
                            {msg.codeSnapshot.slice(0, 150)}...
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback & Share */}
                  {msg.role === 'model' && !msg.isError && (
                    <div className="flex gap-2 mt-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleFeedback(msg.id, 'helpful')}
                        className={`p-1 rounded hover:bg-surface-hover cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${msg.feedback === 'helpful' ? 'text-green-500' : 'text-text-muted'}`}
                        title="Helpful"
                        aria-label="Mark as helpful"
                      >
                        <Icon icon="lucide:thumbs-up" className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, 'unhelpful')}
                        className={`p-1 rounded hover:bg-surface-hover cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${msg.feedback === 'unhelpful' ? 'text-red-500' : 'text-text-muted'}`}
                        title="Unhelpful"
                        aria-label="Mark as unhelpful"
                      >
                        <Icon icon="lucide:thumbs-down" className="w-3 h-3" />
                      </button>
                      {msg.codeSnapshot && onSharePrompt && (
                        <button
                          onClick={() => {
                            const userMsg = messages
                              .slice(0, messages.indexOf(msg))
                              .reverse()
                              .find((m) => m.role === 'user');
                            if (userMsg) {
                              onSharePrompt(userMsg.text, msg.codeSnapshot);
                            }
                          }}
                          className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-primary cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                          title="Share this prompt"
                          aria-label="Share this prompt"
                        >
                          <Icon icon="lucide:share-2" className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {canRegenerate && (
                <div className="flex justify-start pl-2">
                  <button
                    onClick={handleRegenerate}
                    title="Regenerate response"
                    className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted hover:text-primary transition-colors py-1.5 px-2.5 rounded-lg hover:bg-surface-hover cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                  >
                    <Icon icon="lucide:refresh-cw" className="w-3 h-3" />
                    Regenerate
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col gap-2 max-w-[85%] mr-auto items-start animate-pulse">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                    <span>Generating</span>
                  </div>
                  <div className="bg-surface border border-border p-4 rounded-2xl rounded-bl-sm text-text text-sm flex items-center gap-3">
                    <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-primary" />
                    <span>Designing Pipeline...</span>
                  </div>
                </div>
              )}
            </div>
          ))}

        {/* --- TAB: HISTORY --- */}
        {activeTab === 'history' && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Manual Save Button */}
            <div className="p-3 border-b border-border/70 bg-background/35">
              <button
                onClick={() => {
                  if (snapshotSaving) return;
                  setSnapshotSaving(true);
                  onSaveVersion('Manual Snapshot');
                  setTimeout(() => setSnapshotSaving(false), 1500);
                }}
                disabled={snapshotSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold text-text transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                {snapshotSaving ? (
                  <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 text-primary animate-spin" />
                ) : (
                  <Icon icon="lucide:archive" className="w-3.5 h-3.5 text-primary" />
                )}
                {snapshotSaving ? 'Saving...' : 'Create Snapshot'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border p-4 space-y-4">
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted text-xs gap-3 opacity-60">
                  <Icon icon="lucide:clock" className="w-8 h-8 opacity-20" />
                  <p>No saved versions yet.</p>
                </div>
              ) : (
                <div className="relative border-l border-border ml-3 space-y-6">
                  {versions
                    .slice()
                    .reverse()
                    .map((version, index) => {
                      return (
                        <div key={version.id} className="relative pl-6 group">
                          <div
                            className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border transition-colors ${
                              version.source === 'manual'
                                ? 'bg-emerald-500 border-emerald-600'
                                : 'bg-border border-transparent group-hover:bg-primary group-hover:border-primary'
                            }`}
                          ></div>

                          <div className="bg-surface border border-border rounded-xl p-3 hover:bg-surface-hover transition-all shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-text flex items-center gap-2">
                                  {version.label}
                                  {version.source === 'manual' && (
                                    <span className="text-[8px] uppercase tracking-wider bg-emerald-500/10 text-emerald-500 px-1 py-0.5 rounded">
                                      Saved
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] font-mono text-text-muted mt-0.5">
                                  {new Date(version.timestamp).toLocaleString(undefined, {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </span>
                              </div>
                              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                                v{versions.length - index}
                              </span>
                            </div>

                            <div className="p-2 bg-background/50 rounded border border-border/50 mb-3 overflow-hidden">
                              <pre className="text-[9px] font-mono text-text-muted line-clamp-3 opacity-70">
                                {version.code}
                              </pre>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onRestoreVersion(version)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold bg-surface hover:bg-background border border-border rounded-lg transition-colors group/restore cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                              >
                                <Icon
                                  icon="lucide:rotate-ccw"
                                  className="w-3 h-3 group-hover/restore:rotate-[-45deg] transition-transform"
                                />
                                Restore
                              </button>
                              <button
                                onClick={() => handleCopyCode(version.code, version.id)}
                                className="p-1.5 text-text-muted hover:text-text border border-border rounded-lg hover:bg-background cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
                                title="Copy Code"
                                aria-label={justCopied === version.id ? 'Code copied' : 'Copy code'}
                              >
                                {justCopied === version.id ? (
                                  <Icon icon="lucide:check" className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Icon icon="lucide:copy" className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Area (Only visible in Chat Tab) */}
      {activeTab === 'chat' && (
        <div className="p-3 bg-background/80 border-t border-border/70 relative z-10">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 bg-surface border border-border rounded-xl p-2 focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgb(var(--primary)/0.12)] transition-all"
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={`Ask ArchiGram.ai (${selectedDomain})...`}
              aria-label="Ask ArchiGram AI"
              className="w-full bg-transparent text-sm text-text placeholder:text-text-muted/50 p-2 max-h-32 min-h-[40px] resize-none focus:outline-none scrollbar-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="p-2 bg-primary hover:bg-primary-hover disabled:bg-surface-hover disabled:text-text-dim text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none mb-0.5"
            >
              {isLoading ? (
                <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
              ) : (
                <Icon icon="lucide:send" className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="flex justify-between items-center px-1 mt-2">
            <span className="text-[9px] text-text-muted">
              Gemini 3 Flash • {selectedDomain} Context
            </span>
            {messages.length > 0 && (
              <button
                onClick={handleClearHistory}
                className={`text-[9px] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/50 rounded ${confirmingClear ? 'text-red-500 font-semibold' : 'text-text-muted hover:text-red-500'}`}
              >
                {confirmingClear ? 'Confirm Clear?' : 'Clear Chat'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CopilotPanel;
