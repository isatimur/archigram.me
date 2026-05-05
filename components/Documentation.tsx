import { Icon } from '@iconify/react';
import React, { useState, useMemo } from 'react';
import { AppView } from '../types.ts';
import LiveDiagramBlock from './LiveDiagramBlock.tsx';

interface DocumentationProps {
  onNavigate: (view: AppView) => void;
}

type DocSection = {
  id: string;
  label: string;
  group: string;
  keywords: string[];
  icon: React.ReactNode;
};

const DOC_SECTIONS: DocSection[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    group: 'Essentials',
    keywords: ['start', 'quick', 'intro', 'begin', 'setup', 'install'],
    icon: <Icon icon="lucide:zap" className="w-4 h-4" />,
  },
  {
    id: 'ai-prompting',
    label: 'AI Prompting',
    group: 'Essentials',
    keywords: ['prompt', 'ai', 'gemini', 'chat', 'copilot', 'generate'],
    icon: <Icon icon="lucide:code-2" className="w-4 h-4" />,
  },
  {
    id: 'shortcuts',
    label: 'Shortcuts',
    group: 'Essentials',
    keywords: ['keyboard', 'shortcut', 'hotkey', 'keybinding', 'ctrl', 'cmd'],
    icon: <Icon icon="lucide:keyboard" className="w-4 h-4" />,
  },
  {
    id: 'sequence',
    label: 'Sequence',
    group: 'Diagram Syntax',
    keywords: ['sequence', 'participant', 'actor', 'message', 'api', 'interaction'],
    icon: <Icon icon="lucide:layout-template" className="w-4 h-4" />,
  },
  {
    id: 'flowchart',
    label: 'Flowchart',
    group: 'Diagram Syntax',
    keywords: ['flow', 'graph', 'decision', 'process', 'logic', 'node', 'edge'],
    icon: <Icon icon="lucide:network" className="w-4 h-4" />,
  },
  {
    id: 'class',
    label: 'Class',
    group: 'Diagram Syntax',
    keywords: ['class', 'uml', 'object', 'inheritance', 'oop', 'method', 'property'],
    icon: <Icon icon="lucide:layout-template" className="w-4 h-4" />,
  },
  {
    id: 'state',
    label: 'State',
    group: 'Diagram Syntax',
    keywords: ['state', 'transition', 'lifecycle', 'fsm', 'machine', 'status'],
    icon: <Icon icon="lucide:layout-template" className="w-4 h-4" />,
  },
  {
    id: 'er',
    label: 'ER Diagram',
    group: 'Diagram Syntax',
    keywords: ['er', 'entity', 'relationship', 'database', 'schema', 'table', 'sql'],
    icon: <Icon icon="lucide:database" className="w-4 h-4" />,
  },
  {
    id: 'gantt',
    label: 'Gantt',
    group: 'Diagram Syntax',
    keywords: ['gantt', 'timeline', 'schedule', 'project', 'milestone', 'task', 'date'],
    icon: <Icon icon="lucide:clock" className="w-4 h-4" />,
  },
  {
    id: 'mindmap',
    label: 'Mindmap',
    group: 'Diagram Syntax',
    keywords: ['mind', 'map', 'brainstorm', 'hierarchy', 'tree', 'idea'],
    icon: <Icon icon="lucide:brain-circuit" className="w-4 h-4" />,
  },
  {
    id: 'git',
    label: 'Git Graph',
    group: 'Diagram Syntax',
    keywords: ['git', 'branch', 'commit', 'merge', 'version', 'repo'],
    icon: <Icon icon="lucide:git-branch" className="w-4 h-4" />,
  },
  {
    id: 'exporting',
    label: 'Export & Share',
    group: 'Guides',
    keywords: ['export', 'share', 'svg', 'png', 'download', 'link', 'publish'],
    icon: <Icon icon="lucide:share-2" className="w-4 h-4" />,
  },
  {
    id: 'themes',
    label: 'Custom Themes',
    group: 'Guides',
    keywords: ['theme', 'color', 'dark', 'light', 'style', 'css', 'variable', 'forest', 'midnight'],
    icon: <Icon icon="lucide:palette" className="w-4 h-4" />,
  },
];

const Documentation: React.FC<DocumentationProps> = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOC_SECTIONS;
    const q = searchQuery.toLowerCase();
    return DOC_SECTIONS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.keywords.some((k) => k.includes(q))
    );
  }, [searchQuery]);

  const visibleGroups = useMemo(() => {
    const groups = new Set(filteredSections.map((s) => s.group));
    return groups;
  }, [filteredSections]);

  return (
    <div className="h-screen w-screen bg-[#09090b] text-text flex flex-col font-sans overflow-hidden">
      {/* Doc Navbar */}
      <nav className="h-16 border-b border-border bg-surface/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('landing')}
            className="p-2 hover:bg-surface-hover rounded-lg text-text-muted hover:text-text transition-colors"
            title="Back to Home"
          >
            <Icon icon="lucide:arrow-left" className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-border"></div>
          <div className="flex items-center gap-2">
            <Icon icon="lucide:book" className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">Documentation</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 max-w-md w-full mx-4">
          <div className="relative w-full">
            <Icon
              icon="lucide:search"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const q = e.target.value.trim().toLowerCase();
                if (q) {
                  const match = DOC_SECTIONS.find(
                    (s) =>
                      s.label.toLowerCase().includes(q) || s.keywords.some((k) => k.includes(q))
                  );
                  if (match) scrollTo(match.id);
                }
              }}
              placeholder="Search docs..."
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-8 py-1.5 text-sm text-text focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                <Icon icon="lucide:x" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => onNavigate('app')}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all"
        >
          Open App
        </button>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-surface/30 hidden md:flex flex-col overflow-y-auto shrink-0">
          <div className="p-4 space-y-6">
            {filteredSections.length === 0 ? (
              <p className="text-xs text-text-muted px-2 py-4 text-center">
                No results for "{searchQuery}"
              </p>
            ) : (
              (['Essentials', 'Diagram Syntax', 'Guides'] as const).map((group) => {
                if (!visibleGroups.has(group)) return null;
                const items = filteredSections.filter((s) => s.group === group);
                return (
                  <div key={group}>
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-2">
                      {group}
                    </h3>
                    <div className="space-y-1">
                      {items.map((s) => (
                        <React.Fragment key={s.id}>
                          <SidebarLink
                            active={activeSection === s.id}
                            onClick={() => scrollTo(s.id)}
                            icon={s.icon}
                          >
                            {s.label}
                          </SidebarLink>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border p-8 md:p-12 max-w-4xl mx-auto">
          <section id="getting-started" className="mb-16 scroll-mt-20">
            <h1 className="text-4xl font-bold mb-6 text-white">Getting Started</h1>
            <p className="text-lg text-text-muted mb-6 leading-relaxed">
              Archigram.ai combines the structured power of Mermaid.js with the generative
              intelligence of Gemini 3 Flash. Unlike traditional drag-and-drop tools, Archigram uses
              a "Code-First, AI-Assisted" approach.
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Icon icon="lucide:zap" className="w-5 h-5 text-accent" />
                Quick Start
              </h3>
              <ol className="list-decimal list-inside space-y-3 text-text-muted">
                <li>
                  Click <strong>New Diagram</strong> in the sidebar.
                </li>
                <li>Type your request in the AI Copilot (e.g., "Create a login flow").</li>
                <li>Watch the diagram generate instantly.</li>
                <li>Refine the code manually in the editor or continue chatting with the AI.</li>
              </ol>
            </div>
          </section>

          <section id="ai-prompting" className="mb-16 scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
              <Icon icon="lucide:code-2" className="w-8 h-8 text-primary" />
              AI Prompting Guide
            </h2>
            <p className="text-text-muted mb-6">
              To get the best results from Gemini 3 Flash, be specific about the technical
              components and the flow logic.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 border border-red-500/20 bg-red-500/5 rounded-xl">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2 block">
                  Poor Prompt
                </span>
                <p className="text-sm">"Make a diagram for an app."</p>
              </div>
              <div className="p-5 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2 block">
                  Great Prompt
                </span>
                <p className="text-sm">
                  "Create a sequence diagram for a ride-sharing app where a User requests a ride,
                  the System matches a Driver, and the Driver accepts the ride. Include database
                  transactions."
                </p>
              </div>
            </div>
          </section>

          <section id="shortcuts" className="mb-16 scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6 text-white flex items-center gap-3">
              <Icon icon="lucide:keyboard" className="w-8 h-8 text-primary" />
              Keyboard Shortcuts
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-text mb-3">Editor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ShortcutKey combo={['Cmd', 'Z']} desc="Undo changes" />
                  <ShortcutKey combo={['Cmd', 'Y']} desc="Redo changes" />
                  <ShortcutKey combo={['Cmd', 'S']} desc="Save project (auto-save feedback)" />
                  <ShortcutKey combo={['Cmd', 'Enter']} desc="Submit AI Prompt" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text mb-3">Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ShortcutKey combo={['Cmd', 'N']} desc="New project" />
                  <ShortcutKey combo={['Cmd', 'D']} desc="Duplicate diagram" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text mb-3">Export & Share</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ShortcutKey combo={['Cmd', 'E']} desc="Export as PNG" />
                  <ShortcutKey combo={['Cmd', 'Shift', 'E']} desc="Export as SVG" />
                  <ShortcutKey combo={['Cmd', 'Shift', 'P']} desc="Publish to gallery" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-text mb-3">Navigation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ShortcutKey combo={['Cmd', 'K']} desc="Open command palette" />
                  <ShortcutKey combo={['Cmd', 'G']} desc="Toggle gallery" />
                  <ShortcutKey combo={['Cmd', '/']} desc="Toggle AI chat" />
                  <ShortcutKey combo={['Esc']} desc="Close modals / command palette" />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border my-12" />

          {/* DIAGRAM TYPES */}

          <section id="sequence" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-2 text-white">Sequence Diagrams</h2>
            <p className="text-text-muted mb-6">
              Used to show interactions between objects or systems in sequential order. Essential
              for API design and communication flows.
            </p>
            <LiveDiagramBlock
              title="Sequence Diagram"
              initialCode={`sequenceDiagram
    autonumber
    actor User
    participant API as Backend API
    participant DB as Database

    User->>API: Request Data
    activate API
    API->>DB: Query
    DB-->>API: Result
    API-->>User: Response Payload
    deactivate API`}
            />
          </section>

          <section id="flowchart" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-2 text-white">Flowcharts</h2>
            <p className="text-text-muted mb-6">
              Versatile diagrams for mapping process flows, decision trees, and system logic.
              Supports Top-Down (TD) and Left-Right (LR) layouts.
            </p>
            <LiveDiagramBlock
              title="Flowchart"
              initialCode={`graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]`}
            />
          </section>

          <section id="class" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-2 text-white">Class Diagrams</h2>
            <p className="text-text-muted mb-6">
              Standard UML class diagrams for object-oriented modeling. Define properties, methods,
              and relationships.
            </p>
            <LiveDiagramBlock
              title="Class Diagram"
              initialCode={`classDiagram
    class Animal {
        +String name
        +int age
        +eat()
    }
    class Duck {
        +swim()
        +quack()
    }
    class Fish {
        +swim()
    }
    Animal <|-- Duck
    Animal <|-- Fish`}
            />
          </section>

          <section id="state" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-2 text-white">State Diagrams</h2>
            <p className="text-text-muted mb-6">
              Describe the states of a system and the transitions between them. Useful for lifecycle
              management (e.g., Order Status, Auth Flow).
            </p>
            <LiveDiagramBlock
              title="State Diagram"
              initialCode={`stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Submit Event
    Processing --> Success : Valid
    Processing --> Error : Invalid
    Success --> [*]
    Error --> Idle : Retry`}
            />
          </section>

          <section id="er" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-2 text-white">ER Diagrams</h2>
            <p className="text-text-muted mb-6">
              Entity-Relationship diagrams for database schema design. Define entities, attributes,
              and cardinality (one-to-one, one-to-many).
            </p>
            <LiveDiagramBlock
              title="ER Diagram"
              initialCode={`erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int id
        date created_at
    }`}
            />
          </section>

          <section id="gantt" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-2 text-white">Gantt Charts</h2>
            <p className="text-text-muted mb-6">
              Project management timelines. Visualize schedules, dependencies, and milestones.
            </p>
            <LiveDiagramBlock
              title="Gantt Chart"
              initialCode={`gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Design
    Wireframing      :a1, 2024-01-01, 7d
    Prototyping      :after a1, 5d
    section Dev
    Backend API      :2024-01-10, 10d
    Frontend         :2024-01-12, 10d`}
            />
          </section>

          <section id="mindmap" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-2 text-white">Mindmaps</h2>
            <p className="text-text-muted mb-6">
              Hierarchical layout for brainstorming and organizing ideas.
            </p>
            <LiveDiagramBlock
              title="Mindmap"
              initialCode={`mindmap
  root((Archigram))
    Features
      AI Generation
      Live Preview
      Export SVG
    Tech Stack
      React
      Mermaid.js
      Gemini 3`}
            />
          </section>

          <section id="git" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-2 text-white">Git Graph</h2>
            <p className="text-text-muted mb-6">
              Visualize git branching strategies, commits, and merges.
            </p>
            <LiveDiagramBlock
              title="Git Graph"
              initialCode={`gitGraph
   commit
   commit
   branch develop
   checkout develop
   commit
   commit
   checkout main
   merge develop
   commit`}
            />
          </section>

          <hr className="border-border my-12" />

          <section id="exporting" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 text-white">Export & Sharing</h2>
            <div className="space-y-4 text-text-muted">
              <p>
                <strong>SVG Export:</strong> Best for high-quality printing and editing in vector
                tools like Illustrator. Preserves all colors and shapes at any resolution.
              </p>
              <p>
                <strong>PNG Export:</strong> Best for slides, documents, and quick sharing. Renders
                at 3× resolution for crispness on retina displays.
              </p>
              <p>
                <strong>Share Link:</strong> Generates a URL with the entire diagram code
                LZ-compressed into the hash — no server required. Anyone with the link sees the
                exact same diagram instantly.
              </p>
              <p>
                <strong>Publish to Gallery:</strong> Saves the diagram to the public Community
                Gallery with a title, description, and tags. Requires a free account.
              </p>
              <p>
                <strong>Copy Code:</strong> Copies raw Mermaid syntax to clipboard — paste it
                directly into GitHub READMEs, Confluence, or Notion.
              </p>
            </div>
          </section>

          <section id="themes" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-3">
              <Icon icon="lucide:palette" className="w-7 h-7 text-primary" />
              Custom Themes
            </h2>
            <p className="text-text-muted mb-6">
              ArchiGram ships five built-in themes. Switch between them using the palette icon in
              the header toolbar. Each theme updates the editor, preview, and all UI surfaces
              simultaneously.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  name: 'Dark',
                  desc: 'Default. Deep zinc background, indigo accents.',
                  dot: 'bg-zinc-800 border-zinc-600',
                },
                {
                  name: 'Midnight',
                  desc: 'Pure black canvas with blue highlights.',
                  dot: 'bg-black border-blue-700',
                },
                {
                  name: 'Forest',
                  desc: 'Deep green tones, calm and focused.',
                  dot: 'bg-green-950 border-green-700',
                },
                {
                  name: 'Light',
                  desc: 'Bright white surface for daytime use.',
                  dot: 'bg-white border-slate-300',
                },
                {
                  name: 'Neutral',
                  desc: 'Low-contrast slate, easy on the eyes.',
                  dot: 'bg-slate-100 border-slate-400',
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="flex items-start gap-3 p-4 bg-surface border border-border rounded-xl"
                >
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 ${t.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-text">{t.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <h4 className="text-sm font-bold mb-3 text-text">CSS Variable Reference</h4>
              <p className="text-xs text-text-muted mb-3">
                All themes are driven by CSS custom properties. Override them in your own stylesheet
                when self-hosting.
              </p>
              <div className="font-mono text-xs space-y-1 text-text-muted">
                {[
                  ['--bg', 'Page background'],
                  ['--surface', 'Card / panel background'],
                  ['--surface-hover', 'Hover state surface'],
                  ['--border', 'Border color'],
                  ['--text', 'Primary text'],
                  ['--text-muted', 'Secondary / placeholder text'],
                  ['--primary', 'Brand accent (buttons, links)'],
                  ['--accent', 'Secondary highlight'],
                ].map(([v, d]) => (
                  <div key={v} className="flex gap-3">
                    <span className="text-primary w-40 shrink-0">{v}</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="mt-20 pt-10 border-t border-border text-center text-text-muted text-sm pb-10">
            <p>Still have questions?</p>
            <a href="mailto:support@archigram.ai" className="text-primary hover:underline">
              Contact Support
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
};

const SidebarLink = ({
  children,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text hover:bg-surface-hover'}`}
  >
    {icon}
    {children}
  </button>
);

const ShortcutKey = ({ combo, desc }: { combo: string[]; desc: string }) => (
  <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
    <span className="text-sm text-text-muted">{desc}</span>
    <div className="flex gap-1">
      {combo.map((k: string) => (
        <kbd
          key={k}
          className="px-2 py-1 bg-background border border-border rounded text-xs font-mono text-text font-bold shadow-sm"
        >
          {k}
        </kbd>
      ))}
    </div>
  </div>
);

export default Documentation;
