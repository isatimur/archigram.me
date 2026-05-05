import { Icon } from '@iconify/react';
import React from 'react';
import { AppView } from '../types.ts';
import { FAQ_DATA } from '../constants.ts';

interface FAQPageProps {
  onNavigate: (view: AppView) => void;
}

const FAQPage: React.FC<FAQPageProps> = ({ onNavigate }) => {
  // JSON-LD Schema Construction
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
    <div className="min-h-screen w-screen bg-[#09090b] text-white flex flex-col font-sans overflow-y-auto">
      {/* Inject JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      {/* Navbar */}
      <nav className="h-16 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('landing')}
            className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Back to Home"
          >
            <Icon icon="lucide:arrow-left" className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <Icon icon="lucide:rocket" className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-lg tracking-tight">ArchiGram.ai</span>
          </div>
        </div>
        <button
          onClick={() => onNavigate('app')}
          className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          Launch Studio
        </button>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-6 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <Icon icon="lucide:help-circle" className="w-6 h-6" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Everything you need to know about the platform, billing, and technical capabilities.
          </p>
        </div>

        <div className="grid gap-6">
          {FAQ_DATA.map((item, index) => (
            <div
              key={index}
              className="group bg-zinc-900/30 border border-white/5 hover:border-indigo-500/30 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
            >
              <h3 className="text-lg font-bold text-white mb-3 flex items-start gap-3">
                <span className="text-indigo-500/50 mt-0.5">Q.</span>
                {item.question}
              </h3>
              <p className="text-zinc-400 leading-relaxed pl-7 border-l-2 border-white/5 ml-1.5 group-hover:border-indigo-500/20 transition-colors">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 text-center">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="text-zinc-400 mb-8">
            Can't find the answer you're looking for? Please chat to our friendly team.
          </p>
          <a
            href="mailto:support@archigram.ai"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors"
          >
            Contact Support
          </a>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-[#050507] py-8 text-center text-zinc-600 text-sm flex flex-col items-center gap-2">
        <p>&copy; {new Date().getFullYear()} ArchiGram.ai OSS. Built for Engineers.</p>
        <a
          href="https://beyond9to6.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-indigo-400 transition-colors text-xs opacity-70 hover:opacity-100"
        >
          A Project by{' '}
          <span className="font-bold underline decoration-dotted decoration-zinc-600 underline-offset-2">
            Beyond 9to6
          </span>
        </a>
      </footer>
    </div>
  );
};

export default FAQPage;
