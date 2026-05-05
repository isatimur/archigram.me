import { Icon } from '@iconify/react';
import React from 'react';
import { AppView } from '../types.ts';

interface LegalPageProps {
  type: 'privacy' | 'terms' | 'license';
  onNavigate: (view: AppView) => void;
}

const LegalPage: React.FC<LegalPageProps> = ({ type, onNavigate }) => {
  const getContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          icon: <Icon icon="lucide:shield" className="w-6 h-6 text-emerald-400" />,
          content: (
            <div className="space-y-6 text-zinc-400">
              <p>Last Updated: May 1, 2026</p>
              <p>
                At Archigram (<strong>archigram.me</strong>), we prioritize your privacy and data
                security. This Privacy Policy explains how we collect, use, and protect your
                information when you use our AI architecture diagramming tools.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">1. Information We Collect</h3>
              <p>
                <strong>Account data:</strong> When you sign in with Google, we receive your name,
                email address, and profile picture from Google's OAuth service. This is used solely
                to identify your account and display your profile.
              </p>
              <p>
                <strong>Diagram data:</strong> Your diagrams are stored locally in your browser
                (localStorage). If you sign in, your diagrams are synced to our Firebase Firestore
                database so you can access them across devices. Published diagrams are stored in our
                community database and visible to other users.
              </p>
              <p>
                <strong>Usage analytics:</strong> We use Plausible Analytics (privacy-friendly, no
                cookies, no personal data) to understand aggregate usage patterns such as feature
                usage counts. No personally identifiable information is collected for analytics.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">2. How We Use Your Data</h3>
              <p>
                We use your data to: provide and improve the Archigram service; sync your diagrams
                across devices when signed in; display your authored content in the community
                gallery. We do not sell your data to third parties.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">3. AI Processing</h3>
              <p>
                When you use AI generation features, your prompt text and current diagram code are
                sent to Google's Gemini API for processing. This data is used solely to generate the
                diagram response and is not used to train Google's models by default (subject to
                Google Cloud's data privacy policies for API usage).
              </p>

              <h3 className="text-xl font-bold text-white mt-8">4. Google Sign-In</h3>
              <p>
                Archigram uses Google OAuth 2.0 (via Firebase Authentication) for sign-in. By
                signing in with Google, you authorize Archigram to access your basic profile
                information (name, email, profile photo). We do not request access to your Google
                Drive, Gmail, or any other Google services. You can revoke this authorization at any
                time via your{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  className="text-indigo-400 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Account permissions
                </a>
                .
              </p>

              <h3 className="text-xl font-bold text-white mt-8">5. Data Retention & Deletion</h3>
              <p>
                You can delete your account and all associated data at any time from your profile
                settings. Deleting your account removes your synced diagrams and profile data from
                our servers. Locally stored diagrams remain in your browser until you clear them.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">6. Contact</h3>
              <p>
                For privacy questions, contact us at{' '}
                <a href="mailto:privacy@archigram.me" className="text-indigo-400 underline">
                  privacy@archigram.me
                </a>
                .
              </p>
            </div>
          ),
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          icon: <Icon icon="lucide:file-text" className="w-6 h-6 text-primary" />,
          content: (
            <div className="space-y-6 text-zinc-400">
              <p>Last Updated: May 1, 2026</p>
              <p>
                These Terms of Service govern your use of Archigram at <strong>archigram.me</strong>
                . By using the service you agree to these terms.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">1. Acceptance of Terms</h3>
              <p>
                By accessing and using Archigram, you accept and agree to be bound by these Terms of
                Service and our Privacy Policy. If you do not agree, do not use the service.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">2. Use License</h3>
              <p>
                Archigram is open-source software licensed under the MIT License. You are free to
                use the hosted version for personal or commercial diagramming at no charge. You may
                not redistribute the hosted service itself under a different brand name without
                attribution to the original project.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">3. User Accounts</h3>
              <p>
                You may sign in using Google OAuth. You are responsible for maintaining the security
                of your account. You may not use another person's account or share your account
                credentials. We reserve the right to suspend accounts that violate these terms.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">4. Community Content</h3>
              <p>
                Diagrams you publish to the Community Gallery are publicly visible. By publishing,
                you grant Archigram a non-exclusive, royalty-free license to display the diagram.
                You retain ownership of your content. You may not publish content that is illegal,
                harmful, or infringes third-party intellectual property.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">5. AI-Generated Content</h3>
              <p>
                AI-generated diagrams are provided as-is. We do not warrant that AI outputs are
                accurate, complete, or suitable for production use without human review. You are
                responsible for reviewing and validating any AI-generated content before use.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">6. Disclaimer of Warranties</h3>
              <p>
                Archigram is provided "as is" without warranties of any kind, expressed or implied.
                We do not guarantee uninterrupted availability or error-free operation.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">7. Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, Archigram and its contributors shall not be
                liable for any indirect, incidental, or consequential damages arising from your use
                of the service.
              </p>

              <h3 className="text-xl font-bold text-white mt-8">8. Contact</h3>
              <p>
                For questions about these terms, contact us at{' '}
                <a href="mailto:legal@archigram.me" className="text-indigo-400 underline">
                  legal@archigram.me
                </a>
                .
              </p>
            </div>
          ),
        };
      case 'license':
        return {
          title: 'Open Source License',
          icon: <Icon icon="lucide:scale" className="w-6 h-6 text-accent" />,
          content: (
            <div className="space-y-6 text-zinc-400">
              <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto">
                <p className="mb-4">MIT License</p>
                <p className="mb-4">Copyright (c) 2024 Archigram OSS</p>
                <p className="mb-4">
                  Permission is hereby granted, free of charge, to any person obtaining a copy of
                  this software and associated documentation files (the "Software"), to deal in the
                  Software without restriction, including without limitation the rights to use,
                  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
                  Software, and to permit persons to whom the Software is furnished to do so,
                  subject to the following conditions:
                </p>
                <p className="mb-4">
                  The above copyright notice and this permission notice shall be included in all
                  copies or substantial portions of the Software.
                </p>
                <p>
                  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
                  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
                  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
                  AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
                  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                </p>
              </div>
              <p>
                Archigram is proud to be open source. You can find our source code on GitHub and
                contribute to the project.
              </p>
            </div>
          ),
        };
    }
  };

  const { title, icon, content } = getContent() || { title: '', icon: null, content: null };

  return (
    <div className="min-h-screen w-screen bg-[#09090b] text-white flex flex-col font-sans overflow-y-auto">
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
            <span className="font-bold text-lg tracking-tight">Archigram</span>
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
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-800/50 border border-white/10 mb-6">
            {icon}
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">{title}</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full"></div>
        </div>

        <div className="prose prose-invert prose-zinc max-w-none">{content}</div>
      </main>

      <footer className="border-t border-white/5 bg-[#050507] py-8 text-center text-zinc-600 text-sm flex flex-col items-center gap-2">
        <p>&copy; {new Date().getFullYear()} Archigram OSS. Built for Engineers.</p>
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

export default LegalPage;
