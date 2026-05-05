import { Icon } from '@iconify/react';
import React from 'react';
import { AuditReport } from '../services/geminiService.ts';

interface AuditModalProps {
  onClose: () => void;
  report: AuditReport | null;
  isLoading: boolean;
}

const AuditModal: React.FC<AuditModalProps> = ({ onClose, report, isLoading }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/50';
    if (score >= 50) return 'text-yellow-400 border-yellow-500/50';
    return 'text-red-400 border-red-500/50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Solid';
    if (score >= 60) return 'Needs Work';
    return 'Critical';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up ring-1 ring-white/5">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#27272a]/30">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Icon icon="lucide:shield-check" className="w-6 h-6 text-indigo-400" />
              Architectural Audit
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              AI-powered security and scalability review.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon
                    icon="lucide:shield-alert"
                    className="w-6 h-6 text-indigo-500 animate-pulse"
                  />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-medium text-white">Scanning Architecture...</p>
                <p className="text-sm text-zinc-500">
                  Checking for SPOFs, open ports, and compliance.
                </p>
              </div>
            </div>
          ) : report ? (
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {/* Score Card */}
              <div className="md:col-span-1 space-y-6">
                <div
                  className={`w-32 h-32 md:w-auto md:h-auto md:aspect-square mx-auto rounded-full border-8 flex flex-col items-center justify-center bg-zinc-900/50 relative group ${getScoreColor(report.score)}`}
                >
                  <span className="text-4xl md:text-5xl font-bold font-mono tracking-tighter text-white">
                    {report.score}
                  </span>
                  <span
                    className={`text-xs md:text-sm font-bold uppercase tracking-widest mt-1 ${getScoreColor(report.score).split(' ')[0]}`}
                  >
                    {getScoreLabel(report.score)}
                  </span>
                  {/* Glow effect */}
                  <div
                    className={`absolute inset-0 rounded-full blur-2xl opacity-20 ${report.score >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  ></div>
                </div>

                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                    Executive Summary
                  </h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">{report.summary}</p>
                </div>
              </div>

              {/* Details Column */}
              <div className="md:col-span-2 space-y-8">
                {/* Risks */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Icon icon="lucide:alert-triangle" className="w-5 h-5 text-amber-500" />
                    Identified Risks
                  </h4>
                  {report.risks.length === 0 ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                      <Icon icon="lucide:check-circle-2" className="w-4 h-4" /> No critical risks
                      identified. Great job!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {report.risks.map((risk, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl hover:border-red-500/30 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-red-200 text-sm">{risk.title}</span>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                risk.severity === 'High'
                                  ? 'bg-red-500 text-white'
                                  : risk.severity === 'Medium'
                                    ? 'bg-amber-500/20 text-amber-500'
                                    : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {risk.severity} Risk
                            </span>
                          </div>
                          <p className="text-xs text-red-200/70">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Improvements */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Icon icon="lucide:lightbulb" className="w-5 h-5 text-indigo-400" />
                    Recommended Actions
                  </h4>
                  <div className="grid gap-3">
                    {report.improvements.map((imp, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl"
                      >
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-indigo-400">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-zinc-300">{imp}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Icon icon="lucide:trending-up" className="w-5 h-5 text-emerald-400" />
                    Architecture Strengths
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {report.strengths.map((str, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
                      >
                        {str}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-20">Failed to load audit report.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditModal;
