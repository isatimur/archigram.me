'use client';
import { Icon } from '@iconify/react';

import React from 'react';
import { useUI } from '@/lib/contexts/UIContext';

type Panel = 'projects' | 'templates' | 'community';

const TOP_ITEMS: { id: Panel; icon: string; label: string }[] = [
  { id: 'projects', icon: 'lucide:folder-open', label: 'Projects' },
  { id: 'templates', icon: 'lucide:layout-template', label: 'Templates' },
  { id: 'community', icon: 'lucide:globe', label: 'Community' },
];

export default function ActivityBar() {
  const { activePanel, setActivePanel, isCopilotOpen, setIsCopilotOpen, setIsShortcutsModalOpen } =
    useUI();

  const togglePanel = (id: Panel) => {
    setActivePanel(activePanel === id ? null : id);
  };

  return (
    <aside
      className="w-12 shrink-0 h-full glass-panel border-r border-border/70 flex flex-col items-center py-2 z-20"
      aria-label="Activity bar"
    >
      {/* Top: panel toggles */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {TOP_ITEMS.map(({ id, icon, label }) => {
          const isActive = activePanel === id;
          return (
            <button
              key={id}
              onClick={() => togglePanel(id)}
              aria-label={label}
              aria-pressed={isActive}
              title={label}
              className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_rgb(var(--primary)/0.12)]'
                  : 'text-text-muted hover:text-text hover:bg-surface-hover border border-transparent'
              }`}
            >
              {isActive && (
                <span className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full shadow-[0_0_10px_rgb(var(--primary)/0.8)]" />
              )}
              <Icon icon={icon} className="w-4.5 h-4.5" />
            </button>
          );
        })}
      </div>

      {/* Bottom: copilot + shortcuts */}
      <div className="flex flex-col items-center gap-1 pb-1">
        <div className="w-6 h-px bg-border mb-1" />

        <button
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          aria-label="Toggle AI Copilot"
          aria-pressed={isCopilotOpen}
          title="AI Copilot (⌘⇧C)"
          className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
            isCopilotOpen
              ? 'bg-accent/15 text-accent border border-accent/30 shadow-[0_0_15px_rgb(var(--accent)/0.12)]'
              : 'text-text-muted hover:text-text hover:bg-surface-hover border border-transparent'
          }`}
        >
          {isCopilotOpen && (
            <span className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-1 h-4 bg-accent rounded-r-full shadow-[0_0_10px_rgb(var(--accent)/0.8)]" />
          )}
          <Icon icon="lucide:bot" className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={() => setIsShortcutsModalOpen(true)}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-hover border border-transparent transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Icon icon="lucide:keyboard" className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
