import { Icon } from '@iconify/react';
import React, { useState, useRef } from 'react';

interface ImageImportModalProps {
  onClose: () => void;
  onImport: (code: string) => void;
}

const ImageImportModal: React.FC<ImageImportModalProps> = ({ onClose, onImport }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setError('File size too large. Please keep it under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!preview) return;

    setIsLoading(true);
    setError(null);

    try {
      // Extract mimetype from base64 string
      const matches = preview.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new Error('Invalid image data');

      const mimeType = matches[1];

      const res = await fetch('/api/v1/image-to-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview, mimeType }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Conversion failed');
      const { code: mermaidCode } = await res.json();
      onImport(mermaidCode);
      onClose();
    } catch (e) {
      console.error(e);
      setError(
        'Failed to convert image. The diagram might be too complex or the AI service is busy.'
      );
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-slide-up ring-1 ring-white/5 relative">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#27272a]/50">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Icon icon="lucide:scan-line" className="w-5 h-5 text-indigo-400" />
              Scan & Convert
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Transform screenshots, sketches, or whiteboards into code.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!preview ? (
            <div
              className={`
                                relative border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
                                ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 hover:bg-zinc-900'}
                            `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon
                  icon="lucide:upload-cloud"
                  className="w-8 h-8 text-zinc-400 group-hover:text-indigo-400"
                />
              </div>
              <p className="text-sm font-medium text-white mb-1">Click or drag image here</p>
              <p className="text-xs text-zinc-500">Supports PNG, JPG, WEBP (Max 5MB)</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black h-64 border border-zinc-800 group">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center p-4">
                <button
                  onClick={() => setPreview(null)}
                  className="text-xs text-zinc-300 hover:text-white underline decoration-dotted"
                >
                  Remove & Upload Different Image
                </button>
              </div>

              {/* Scanning Animation Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                  <div className="w-full h-1 bg-indigo-500/50 absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                  <Icon
                    icon="lucide:loader-2"
                    className="w-10 h-10 text-indigo-500 animate-spin mb-3"
                  />
                  <span className="text-sm font-mono text-indigo-300 animate-pulse">
                    Analyzing Structure...
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
              <Icon icon="lucide:file-warning" className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-[#27272a]/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!preview || isLoading}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Converting...' : 'Convert to Diagram'}
            {!isLoading && <Icon icon="lucide:arrow-right" className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; box-shadow: 0 0 10px #6366f1; }
                    90% { opacity: 1; box-shadow: 0 0 10px #6366f1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
    </div>
  );
};

export default ImageImportModal;
