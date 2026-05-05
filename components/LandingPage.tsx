import { Icon } from '@iconify/react';
import React, { lazy, Suspense } from 'react';
import { AppView } from '../types.ts';
import LiveDiagramBlock from './LiveDiagramBlock.tsx';
import { FAQ_DATA } from '../constants.ts';

const NewsletterSignup = lazy(() => import('./NewsletterSignup.tsx'));

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [showTools, setShowTools] = React.useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const HERO_DIAGRAM = `architecture-beta
    group api(logos:aws-lambda)[API]

    service db(logos:aws-aurora)[Database] in api
    service disk1(logos:aws-glacier)[Storage] in api
    service disk2(logos:aws-s3)[Storage] in api
    service server(logos:aws-ec2)[Server] in api

    db:L -- R:server
    disk1:T -- B:server
    disk2:T -- B:db`;

  const BACKEND_ARCH_DIAGRAM = `graph TD
    User((User)) -->|HTTPS| CDN[Cloudflare CDN]
    CDN --> LB[Load Balancer]

    subgraph VPC [Cloud VPC]
        LB --> Gateway[API Gateway]

        subgraph Service_Mesh [Microservices]
            Auth[Auth Service]
            Order[Order API]
            Pay[Payment API]
        end

        Gateway --> Auth
        Gateway --> Order
        Gateway --> Pay

        Auth -.-> Redis[(Redis Session)]
        Order --> PSQL[(Postgres DB)]
        Pay --> Stripe[Stripe SDK]
    end

    style VPC fill:#18181b,stroke:#3f3f46,color:#fff
    style Service_Mesh fill:#27272a,stroke:#3f3f46,color:#fff
    style Gateway fill:#4f46e5,stroke:#fff,color:#fff`;

  // JSON-LD Schema for FAQPage
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <div className="h-screen w-screen bg-[#04040a] text-white overflow-y-auto overflow-x-hidden relative scroll-smooth">
      {/* Blueprint Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Fine grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        ></div>
        {/* Major grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(34,211,238,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.055) 1px, transparent 1px)`,
            backgroundSize: '200px 200px',
          }}
        ></div>
        {/* Bottom fade */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 40% at 50% 100%, #04040a 0%, transparent 70%)',
          }}
        ></div>
      </div>

      {/* Inject JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      {/* Semantic Header / Navbar */}
      <header
        className="fixed top-0 w-full z-50 border-b border-cyan-400/10 bg-[#04040a]/85 backdrop-blur-xl px-6 h-16 flex items-center justify-between"
        role="banner"
      >
        {/* Logo mark */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => window.scrollTo(0, 0)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.scrollTo(0, 0);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Scroll to top"
        >
          <div className="w-8 h-8 border border-cyan-400/50 flex items-center justify-center relative group-hover:border-cyan-400 transition-colors duration-300">
            <div className="w-3 h-3 border border-cyan-400/50 rotate-45 group-hover:border-cyan-400 transition-colors duration-300"></div>
            <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/8 transition-colors duration-300"></div>
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-[0.12em] text-white">
              ARCHIGRAM<span className="text-cyan-400">.AI</span>
            </div>
            <p className="text-[9px] text-zinc-700 tracking-[0.22em] uppercase font-mono leading-none">
              system design
            </p>
          </div>
        </div>

        <nav
          className="hidden md:flex items-center gap-8 text-[10px] font-mono tracking-[0.18em] uppercase text-zinc-500"
          role="navigation"
        >
          {/* Tools Dropdown */}
          <div className="relative group">
            <button
              className="hover:text-cyan-400 transition-colors flex items-center gap-1 py-4"
              onMouseEnter={() => setShowTools(true)}
              onClick={() => setShowTools(!showTools)}
            >
              Tools{' '}
              <Icon
                icon="lucide:chevron-down"
                className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300"
              />
            </button>

            <div
              className={`absolute top-full left-0 w-56 bg-[#08080f]/98 backdrop-blur-xl border border-cyan-400/15 shadow-2xl overflow-hidden transition-all duration-200 origin-top-left ${showTools ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
              onMouseLeave={() => setShowTools(false)}
            >
              <div className="p-2 space-y-0.5">
                <button
                  onClick={() => onNavigate('app')}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-cyan-400/5 text-left transition-colors group/item border-l-2 border-transparent hover:border-cyan-400"
                >
                  <Icon
                    icon="lucide:terminal"
                    className="w-4 h-4 text-cyan-400/50 group-hover/item:text-cyan-400 transition-colors"
                  />
                  <div>
                    <div className="text-white text-xs font-mono">Mermaid Studio</div>
                    <div className="text-[9px] text-zinc-600 normal-case tracking-normal">
                      Diagrams as Code
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => onNavigate('plantuml')}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-lime-400/5 text-left transition-colors group/item border-l-2 border-transparent hover:border-lime-400"
                >
                  <Icon
                    icon="lucide:binary"
                    className="w-4 h-4 text-lime-400/50 group-hover/item:text-lime-400 transition-colors"
                  />
                  <div>
                    <div className="text-white text-xs font-mono">PlantUML Studio</div>
                    <div className="text-[9px] text-zinc-600 normal-case tracking-normal">
                      Standard UML
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => scrollTo('features')}
            className="hover:text-white transition-colors"
          >
            Platform
          </button>
          <button
            onClick={() => onNavigate('gallery')}
            className="hover:text-cyan-400 text-cyan-400/60 transition-colors flex items-center gap-1.5"
          >
            <Icon icon="lucide:globe" className="w-3 h-3" />
            Community
          </button>
          <button
            onClick={() => scrollTo('use-cases')}
            className="hover:text-white transition-colors"
          >
            Use Cases
          </button>
          <button onClick={() => onNavigate('docs')} className="hover:text-white transition-colors">
            Docs
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('app')}
            className="hidden md:block text-[10px] font-mono tracking-[0.18em] uppercase text-zinc-600 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => onNavigate('app')}
            className="border border-cyan-400/60 text-cyan-400 px-5 py-2 text-[10px] font-mono tracking-[0.18em] uppercase hover:bg-cyan-400 hover:text-black transition-all duration-200"
          >
            Launch Studio
          </button>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section — asymmetric two-column */}
        <section className="relative pt-28 min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-[1.1fr_0.9fr] gap-12 xl:gap-20 items-center py-20">
            {/* Left: headline + CTAs */}
            <div>
              {/* Technical section marker */}
              <div className="flex items-center gap-3 mb-10 animate-fade-in">
                <span className="text-cyan-400 font-mono text-[10px] tracking-[0.25em] uppercase">
                  {'// 001'}
                </span>
                <span className="h-px w-12 bg-cyan-400/40"></span>
                <span className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
                  </span>
                  <span className="text-zinc-600 font-mono text-[10px] tracking-[0.2em] uppercase">
                    v0.2 · Multi-Engine
                  </span>
                </span>
              </div>

              <h1 className="font-display text-7xl md:text-8xl xl:text-9xl font-bold leading-[0.88] tracking-tight mb-8 animate-slide-up">
                <span className="text-white">Architect</span>
                <br />
                <span className="text-white">Systems</span>
                <br />
                <span className="text-cyan-400">Faster.</span>
              </h1>

              <p
                className="text-zinc-400 text-base md:text-lg max-w-sm leading-relaxed mb-10 animate-slide-up opacity-0"
                style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}
              >
                The intelligent canvas for modern engineering. Generate{' '}
                <strong className="text-zinc-200">Mermaid.js and PlantUML</strong> diagrams with
                code-first precision and 100B parameter AI models.
              </p>

              <div
                className="flex flex-wrap items-center gap-4 animate-slide-up opacity-0"
                style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
              >
                <button
                  onClick={() => onNavigate('app')}
                  className="group flex items-center gap-3 px-7 py-3.5 bg-cyan-400 text-black font-mono text-xs font-bold tracking-[0.18em] uppercase hover:bg-cyan-300 transition-colors duration-200"
                  aria-label="Start Diagramming Now"
                >
                  Start Diagramming
                  <Icon
                    icon="lucide:arrow-right"
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  />
                </button>
                <button
                  onClick={() => onNavigate('gallery')}
                  className="flex items-center gap-3 px-7 py-3.5 border border-white/12 text-zinc-400 font-mono text-xs tracking-[0.18em] uppercase hover:border-white/35 hover:text-white transition-all"
                >
                  <Icon icon="lucide:globe" className="w-3.5 h-3.5" />
                  Gallery
                </button>
              </div>

              {/* Engine badges */}
              <div
                className="flex items-center gap-8 mt-12 animate-fade-in opacity-0"
                style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
              >
                {[
                  { val: 'Mermaid', label: 'Native Engine' },
                  { val: 'PlantUML', label: 'UML Support' },
                  { val: 'Gemini', label: 'AI Backbone' },
                ].map(({ val, label }) => (
                  <div key={val} className="group">
                    <div className="font-display text-base font-bold text-zinc-300 group-hover:text-cyan-400 transition-colors">
                      {val}
                    </div>
                    <div className="text-[9px] text-zinc-700 font-mono tracking-[0.2em] uppercase">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: diagram with technical frame */}
            <div
              className="relative animate-slide-up opacity-0"
              style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
            >
              {/* Corner brackets */}
              <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50 z-10"></div>
              <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-cyan-400/50 z-10"></div>
              <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50 z-10"></div>
              <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-cyan-400/50 z-10"></div>
              {/* Frame label */}
              <div className="absolute -top-px left-10 bg-[#04040a] px-2 text-[9px] font-mono text-cyan-400/60 tracking-[0.2em] uppercase z-10 -translate-y-1/2">
                {'// live preview'}
              </div>
              <div className="absolute -bottom-px right-10 bg-[#04040a] px-2 text-[9px] font-mono text-zinc-700 tracking-[0.15em] z-10 translate-y-1/2">
                interactive · zoom enabled
              </div>
              <div className="border border-cyan-400/15 bg-[#060610] overflow-hidden">
                <LiveDiagramBlock
                  initialCode={HERO_DIAGRAM}
                  title="Interactive Architecture Preview"
                  height="520px"
                  enableZoom={true}
                />
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-800 pointer-events-none">
            <span className="text-[9px] font-mono tracking-[0.3em] uppercase">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-zinc-700 to-transparent"></div>
          </div>
        </section>

        {/* Engine support strip */}
        <section className="border-t border-white/5 py-6">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-8 justify-center text-zinc-700 text-[9px] font-mono tracking-[0.22em] uppercase">
            <span className="flex items-center gap-2">
              <Icon icon="lucide:check-circle-2" className="w-3 h-3 text-cyan-400" /> Mermaid.js
              Native
            </span>
            <span className="w-px h-4 bg-zinc-800"></span>
            <span className="flex items-center gap-2">
              <Icon icon="lucide:check-circle-2" className="w-3 h-3 text-lime-400" /> PlantUML
              Support
            </span>
            <span className="w-px h-4 bg-zinc-800"></span>
            <span className="flex items-center gap-2">
              <Icon icon="lucide:check-circle-2" className="w-3 h-3 text-zinc-500" /> Open Source
            </span>
          </div>
        </section>

        {/* Professional Suites Section */}
        <section className="max-w-7xl mx-auto px-6 py-28 border-t border-white/5 relative">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-cyan-400 font-mono text-[10px] tracking-[0.25em] uppercase">
                {'// 002'}
              </span>
              <span className="h-px w-8 bg-cyan-400/30"></span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Enterprise Modeling
              <br />
              Suites
            </h2>
            <p className="text-zinc-500 max-w-xl text-base leading-relaxed">
              Specialized environments for strict UML compliance and enterprise business process
              modeling.
            </p>
          </div>

          <div
            className="relative group cursor-pointer max-w-3xl"
            onClick={() => onNavigate('bpmn')}
          >
            <div className="absolute -top-2 -left-2 w-5 h-5 border-t border-l border-orange-400/40 group-hover:border-orange-400/80 transition-colors z-10"></div>
            <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b border-r border-orange-400/40 group-hover:border-orange-400/80 transition-colors z-10"></div>
            <div className="border border-white/5 group-hover:border-orange-400/25 transition-all duration-300 bg-zinc-900/15 group-hover:bg-zinc-900/35 p-10 flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <Icon icon="lucide:git-branch" className="w-5 h-5 text-orange-400" />
                  <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-orange-400/60">
                    BPMN Studio
                  </span>
                </div>
                <h3 className="font-display text-3xl font-bold text-white mb-4 flex items-center gap-3">
                  Business Process
                  <Icon
                    icon="lucide:arrow-right"
                    className="w-5 h-5 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-orange-400"
                  />
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Model workflows, approvals, and business processes using the BPMN 2.0 standard.
                  Visual drag-and-drop editor with XML export.
                </p>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-[#030305] p-5 border border-white/5 font-mono text-xs text-orange-300/55 group-hover:text-orange-300/80 transition-colors">
                  <span className="text-zinc-700">&lt;bpmn:startEvent /&gt;</span>
                  <br />
                  <span className="text-zinc-700">&nbsp;&nbsp;→ Task: Review</span>
                  <br />
                  <span className="text-zinc-700">&nbsp;&nbsp;→ Gateway: Approve?</span>
                  <br />
                  <span className="text-zinc-700">&lt;bpmn:endEvent /&gt;</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="relative group cursor-pointer max-w-3xl"
            onClick={() => onNavigate('plantuml')}
          >
            {/* Corner brackets */}
            <div className="absolute -top-2 -left-2 w-5 h-5 border-t border-l border-lime-400/40 group-hover:border-lime-400/80 transition-colors z-10"></div>
            <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b border-r border-lime-400/40 group-hover:border-lime-400/80 transition-colors z-10"></div>
            <div className="border border-white/5 group-hover:border-lime-400/25 transition-all duration-300 bg-zinc-900/15 group-hover:bg-zinc-900/35 p-10 flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <Icon icon="lucide:binary" className="w-5 h-5 text-lime-400" />
                  <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-lime-400/60">
                    PlantUML Studio
                  </span>
                </div>
                <h3 className="font-display text-3xl font-bold text-white mb-4 flex items-center gap-3">
                  Standard UML
                  <Icon
                    icon="lucide:arrow-right"
                    className="w-5 h-5 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-lime-400"
                  />
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  The industry standard for textual UML. Generate Sequence, Use Case, Class, and
                  Component diagrams using the powerful PlantUML syntax.
                </p>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-[#030305] p-5 border border-white/5 font-mono text-xs text-lime-300/55 group-hover:text-lime-300/80 transition-colors">
                  <span className="text-zinc-700">@startuml</span>
                  <br />
                  Alice -&gt; Bob: Authentication Request
                  <br />
                  Bob --&gt; Alice: Authentication Response
                  <br />
                  <span className="text-zinc-700">@enduml</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-6 py-28 scroll-mt-16 border-t border-white/5"
        >
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-cyan-400 font-mono text-[10px] tracking-[0.25em] uppercase">
                {'// 003'}
              </span>
              <span className="h-px w-8 bg-cyan-400/30"></span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Engineered for
              <br />
              Engineers
            </h2>
            <p className="text-zinc-500 max-w-xl text-base leading-relaxed">
              Stop fighting with UI tools. Treat your system design like you treat your code.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/5">
            <FeatureCard
              icon={<Icon icon="lucide:code-2" className="w-5 h-5 text-cyan-400" />}
              label="01"
              title="Code-First Diagrams"
              desc="Write standard Mermaid.js code or let AI generate it. Version control your diagrams alongside your source code repository."
            />
            <FeatureCard
              icon={<Icon icon="lucide:bot" className="w-5 h-5 text-pink-400" />}
              label="02"
              title="System Design Copilot"
              desc="Describe your system in plain English. Our AI architect understands Microservices, Event-Driven, and Serverless patterns."
            />
            <FeatureCard
              icon={<Icon icon="lucide:layers" className="w-5 h-5 text-lime-400" />}
              label="03"
              title="Cloud Native Standards"
              desc="Pre-built components for AWS, Azure, GCP, and Kubernetes. Visualize infrastructure with industry-standard icons."
            />
            <FeatureCard
              icon={<Icon icon="lucide:git-branch" className="w-5 h-5 text-amber-400" />}
              label="04"
              title="Git-Friendly & Diffable"
              desc="Text-based diagrams mean you can finally diff your architecture changes in Pull Requests using standard Git tools."
            />
            <FeatureCard
              icon={<Icon icon="lucide:globe" className="w-5 h-5 text-sky-400" />}
              label="05"
              title="Global Gallery"
              desc="Don't start from scratch. Fork proven architectures from engineers at Netflix, Uber, and Airbnb via the Community Gallery."
            />
            <FeatureCard
              icon={<Icon icon="lucide:shield" className="w-5 h-5 text-rose-400" />}
              label="06"
              title="Enterprise Ready"
              desc="Self-hostable, RBAC support, and SSO integration for teams that need security and compliance (Enterprise Tier)."
            />
          </div>
        </section>

        {/* Use Cases Section */}
        <section id="use-cases" className="border-t border-white/5 py-28 relative bg-[#030308]">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          ></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-cyan-400 font-mono text-[10px] tracking-[0.25em] uppercase">
                    {'// 004'}
                  </span>
                  <span className="h-px w-8 bg-cyan-400/30"></span>
                </div>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-12 leading-tight">
                  From Idea to
                  <br />
                  Infrastructure
                </h2>
                <div className="space-y-8">
                  <article className="pl-4 border-l border-white/5 hover:border-cyan-400/40 transition-colors group">
                    <span className="font-mono text-[9px] text-zinc-700 tracking-[0.2em] uppercase">
                      01 /
                    </span>
                    <h3 className="font-display text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mt-1 mb-2">
                      Backend Architecture
                    </h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                      Map out API gateways, microservices, and database relationships before writing
                      a single line of code.
                    </p>
                  </article>
                  <article className="pl-4 border-l border-white/5 hover:border-pink-400/40 transition-colors group">
                    <span className="font-mono text-[9px] text-zinc-700 tracking-[0.2em] uppercase">
                      02 /
                    </span>
                    <h3 className="font-display text-xl font-bold text-white group-hover:text-pink-400 transition-colors mt-1 mb-2">
                      Data Engineering Pipelines
                    </h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                      Visualize ETL pipelines, data lakes, and streaming workflows (Kafka/Flink)
                      using standard flowcharts.
                    </p>
                  </article>
                  <article className="pl-4 border-l border-white/5 hover:border-lime-400/40 transition-colors group">
                    <span className="font-mono text-[9px] text-zinc-700 tracking-[0.2em] uppercase">
                      03 /
                    </span>
                    <h3 className="font-display text-xl font-bold text-white group-hover:text-lime-400 transition-colors mt-1 mb-2">
                      Machine Learning Ops
                    </h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                      Design training pipelines, inference services, and model registries with
                      specialized templates.
                    </p>
                  </article>
                </div>
              </div>

              <div className="relative">
                {/* Corner brackets */}
                <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-cyan-400/30 z-10"></div>
                <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-cyan-400/30 z-10"></div>
                <div className="border border-white/8 bg-[#060610] overflow-hidden">
                  <LiveDiagramBlock
                    initialCode={BACKEND_ARCH_DIAGRAM}
                    title="Backend Architecture Preview"
                    height="520px"
                    enableZoom={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-28 scroll-mt-16">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-cyan-400 font-mono text-[10px] tracking-[0.25em] uppercase">
                {'// 005'}
              </span>
              <span className="h-px w-8 bg-cyan-400/30"></span>
            </div>
            <h2 className="font-display text-4xl font-bold text-white mb-3">Frequently Asked</h2>
            <p className="text-zinc-600 text-sm font-mono">
              Everything you need to know about AI-powered architecture.
            </p>
          </div>

          <div className="space-y-px" itemScope itemType="https://schema.org/FAQPage">
            {FAQ_DATA.map((item, index) => (
              <FaqItem key={index} question={item.question} answer={item.answer} />
            ))}
          </div>

          <div className="mt-12">
            <button
              onClick={() => onNavigate('faq')}
              className="text-cyan-400 hover:text-white font-mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-2 transition-colors group"
            >
              View All FAQs
              <Icon
                icon="lucide:arrow-right"
                className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/5 py-32 px-6 relative overflow-hidden bg-[#030308]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-12">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-cyan-400 font-mono text-[10px] tracking-[0.25em] uppercase">
                  {'// 006'}
                </span>
                <span className="h-px w-8 bg-cyan-400/30"></span>
              </div>
              <h2 className="font-display text-5xl md:text-7xl font-bold text-white leading-[0.9] tracking-tight">
                Ready to
                <br />
                <span className="text-cyan-400">upgrade</span>
                <br />
                your workflow?
              </h2>
            </div>
            <div className="flex flex-col gap-6 md:items-end">
              <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                Join thousands of architects building better systems with AI assistance.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate('app')}
                  className="px-10 py-4 bg-cyan-400 text-black font-mono text-xs font-bold tracking-[0.18em] uppercase hover:bg-cyan-300 transition-colors"
                >
                  Launch Studio Free
                </button>
                <button
                  onClick={() => onNavigate('gallery')}
                  className="px-10 py-4 border border-white/15 text-zinc-400 font-mono text-xs tracking-[0.18em] uppercase hover:border-white/40 hover:text-white transition-all"
                >
                  Explore Gallery
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#020205] py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 border border-cyan-400/40 flex items-center justify-center">
                <div className="w-2.5 h-2.5 border border-cyan-400/50 rotate-45"></div>
              </div>
              <span className="font-display font-bold tracking-[0.12em] text-sm">
                ARCHIGRAM<span className="text-cyan-400">.AI</span>
              </span>
            </div>
            <p className="text-zinc-700 text-sm max-w-sm leading-relaxed mb-6">
              The open-source standard for architecture diagramming. Built by engineers, for
              engineers.
            </p>
            <div className="max-w-sm">
              <p className="text-[10px] text-zinc-600 font-mono mb-3 tracking-[0.22em] uppercase">
                {'// Stay in the loop'}
              </p>
              <Suspense fallback={null}>
                <NewsletterSignup />
              </Suspense>
            </div>
          </div>
          <div>
            <h4 className="text-zinc-600 font-mono text-[10px] tracking-[0.22em] uppercase mb-6">
              Platform
            </h4>
            <ul className="space-y-4 text-sm text-zinc-600">
              <li>
                <button
                  onClick={() => scrollTo('features')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  AI Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('gallery')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Community Templates
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('docs')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Documentation
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-zinc-600 font-mono text-[10px] tracking-[0.22em] uppercase mb-6">
              Legal
            </h4>
            <ul className="space-y-4 text-sm text-zinc-600">
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('license')}
                  className="hover:text-cyan-400 transition-colors"
                >
                  Open Source License
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/5 text-zinc-700 text-[10px] font-mono tracking-[0.15em] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <p>&copy; {new Date().getFullYear()} ArchiGram.ai OSS.</p>
            <span className="hidden md:block">·</span>
            <a
              href="https://beyond9to6.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1 group"
            >
              Part of{' '}
              <span className="text-zinc-500 group-hover:text-white transition-colors underline decoration-dotted underline-offset-4 decoration-zinc-700">
                Beyond 9to6
              </span>
            </a>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors" aria-label="GitHub">
              GitHub
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">
              Twitter
            </a>
            <a href="#" className="hover:text-white transition-colors" aria-label="Discord">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  desc: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, label, title, desc }) => (
  <div className="p-8 bg-[#04040a] hover:bg-zinc-900/50 transition-all duration-300 group relative">
    <div className="absolute top-4 right-4 text-[10px] font-mono text-zinc-800 group-hover:text-zinc-600 transition-colors">
      {label}
    </div>
    <div className="w-10 h-10 border border-white/8 flex items-center justify-center mb-6 group-hover:border-white/25 transition-colors">
      {icon}
    </div>
    <h3 className="font-display text-lg font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
      {title}
    </h3>
    <p className="text-zinc-600 text-sm leading-relaxed">{desc}</p>
  </div>
);

interface FaqItemProps {
  question: string;
  answer: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => (
  <div
    className="border-b border-white/5 py-6 text-left group hover:bg-zinc-900/15 px-4 -mx-4 transition-colors"
    itemScope
    itemProp="mainEntity"
    itemType="https://schema.org/Question"
  >
    <h3
      className="text-sm font-bold text-white mb-2.5 flex items-start gap-3 group-hover:text-cyan-400 transition-colors"
      itemProp="name"
    >
      <span className="font-mono text-[9px] text-zinc-700 shrink-0 pt-0.5 tracking-widest">Q:</span>
      {question}
    </h3>
    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
      <p className="text-zinc-600 text-sm leading-relaxed pl-7" itemProp="text">
        {answer}
      </p>
    </div>
  </div>
);

export default LandingPage;
