import { Icon } from '@iconify/react';
import React from 'react';

type KeyboardShortcutsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ShortcutRow = {
  label: string;
  keys: string[];
};

type ShortcutGroup = {
  heading: string;
  rows: ShortcutRow[];
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    heading: 'EDITOR',
    rows: [
      { label: 'New diagram', keys: ['⌘', 'N'] },
      { label: 'Duplicate', keys: ['⌘', 'D'] },
      { label: 'Copy share link', keys: ['⌘', '⇧', 'S'] },
      { label: 'Publish to gallery', keys: ['⌘', '⇧', 'P'] },
    ],
  },
  {
    heading: 'EXPORT',
    rows: [
      { label: 'Export PNG', keys: ['⌘', 'E'] },
      { label: 'Export SVG', keys: ['⌘', '⇧', 'E'] },
    ],
  },
  {
    heading: 'VIEW',
    rows: [
      { label: 'Toggle AI chat', keys: ['⌘', '/'] },
      { label: 'Command palette', keys: ['⌘', 'K'] },
      { label: 'Open gallery', keys: ['⌘', 'G'] },
      { label: 'This panel', keys: ['?'] },
    ],
  },
  {
    heading: 'AI CHAT',
    rows: [
      { label: 'Submit prompt', keys: ['↵'] },
      { label: 'New line', keys: ['⇧', '↵'] },
    ],
  },
];

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 id="shortcuts-dialog-title" className="text-base font-semibold text-text">
            Keyboard Shortcuts
          </h3>
          <button
            onClick={onClose}
            aria-label="Close shortcuts"
            className="p-2 text-text-muted hover:text-text rounded-lg transition-colors"
          >
            <Icon icon="lucide:x" className="w-4 h-4" />
          </button>
        </div>

        {/* Groups */}
        <div className="space-y-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.heading}>
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">
                {group.heading}
              </p>
              <div className="space-y-1">
                {group.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-0.5">
                    <span className="text-sm text-text">{row.label}</span>
                    <div className="flex items-center gap-1">
                      {row.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 bg-background border border-border rounded text-xs font-mono text-text-muted"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
