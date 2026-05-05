import { Icon } from '@iconify/react';
import React, { useEffect, useRef, useState } from 'react';
import { AppView } from '../types.ts';

interface BPMNStudioProps {
  onNavigate: (view: AppView) => void;
}

type BpmnModelerInstance = {
  importXML: (xml: string) => Promise<{ warnings: unknown[] }>;
  destroy: () => void;
  saveSVG: () => Promise<{ svg: string }>;
};

const EMPTY_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const BPMNStudio: React.FC<BPMNStudioProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnModelerInstance | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Inject BPMN-JS CSS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/bpmn-js@14.0.0/dist/assets/diagram-js.css';
    document.head.appendChild(link);

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://unpkg.com/bpmn-js@14.0.0/dist/assets/bpmn-font/css/bpmn.css';
    document.head.appendChild(fontLink);

    // Initialize Modeler
    const init = async () => {
      if (containerRef.current) {
        try {
          // Use lib/Modeler for better ESM support via esm.sh
          const { default: BpmnModelerClass } = await import('bpmn-js/lib/Modeler');

          modelerRef.current = new BpmnModelerClass({
            container: containerRef.current,
            keyboard: { bindTo: document },
          });

          try {
            await modelerRef.current.importXML(EMPTY_BPMN);
            setIsReady(true);
          } catch (err) {
            console.error('could not import BPMN 2.0 diagram', err);
          }
        } catch (e) {
          console.warn('BPMN-JS library missing or failed to load.', e);
        }
      }
    };

    init();

    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
      }
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(fontLink)) document.head.removeChild(fontLink);
    };
  }, []);

  const handleSaveSvg = async () => {
    if (!modelerRef.current) return;
    try {
      const result = await modelerRef.current.saveSVG();
      const { svg } = result;
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `process-${Date.now()}.svg`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-zinc-100 font-sans">
      {/* Header - Dark Theme for Consistency */}
      <header className="h-16 border-b border-zinc-800 bg-[#09090b] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('landing')}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Back to Home"
          >
            <Icon icon="lucide:arrow-left" className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
                <Icon icon="lucide:monitor-play" className="w-4 h-4" />
              </div>
              BPMN Process Studio
            </h1>
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
              ENTERPRISE EDITION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 text-orange-400 text-xs font-bold rounded-full border border-orange-500/20">
            <Icon icon="lucide:wand-2" className="w-3 h-3" />
            <span>AI Assistant Ready</span>
          </div>
          <button
            onClick={handleSaveSvg}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-zinc-100 text-zinc-900 hover:bg-white rounded-lg shadow-lg transition-all hover:scale-105"
          >
            <Icon icon="lucide:download" className="w-3.5 h-3.5" />
            Export XML/SVG
          </button>
        </div>
      </header>

      {/* Canvas Container */}
      <div className="flex-1 relative bg-zinc-100 overflow-hidden">
        <div id="bpmn-canvas" ref={containerRef} className="w-full h-full"></div>

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 z-10">
            <div className="flex flex-col items-center gap-3">
              <Icon icon="lucide:loader-2" className="w-8 h-8 animate-spin text-orange-600" />
              <p className="text-sm font-medium text-zinc-500">Loading Process Engine...</p>
            </div>
          </div>
        )}

        {/* AI Prompt Overlay - Floating Glassmorphism */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[500px] max-w-[90vw]">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-2 flex gap-2 ring-1 ring-black/5 items-center pl-4 transition-all hover:scale-[1.01]">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0"></div>
            <input
              type="text"
              placeholder="Describe a business process to optimize (e.g., 'Order Fulfillment with risk check')..."
              className="flex-1 bg-transparent text-zinc-800 text-sm focus:outline-none placeholder:text-zinc-400"
            />
            <button className="bg-zinc-900 text-white p-2.5 rounded-xl hover:bg-orange-600 transition-all shadow-md group">
              <Icon
                icon="lucide:play"
                className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-zinc-400 font-medium bg-white/50 px-2 py-1 rounded-full">
              Powered by Gemini 3 Flash
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BPMNStudio;
