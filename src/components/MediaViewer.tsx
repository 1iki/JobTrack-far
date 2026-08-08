import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface MediaViewerProps {
  url?: string;
  imageUrl?: string;
  onClose: () => void;
}

export function MediaViewer({ url, imageUrl, onClose }: MediaViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-full flex flex-col bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-xs font-bold uppercase text-slate-500">Pratinjau Media</h3>
          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                title="Buka di tab baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 flex items-center justify-center min-h-[50vh]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Pratinjau"
              className="max-w-full max-h-full object-contain rounded shadow-sm border border-slate-200 bg-white"
            />
          ) : url ? (
            <iframe
              src={url}
              className="w-full h-full min-h-[60vh] bg-white border border-slate-200 rounded shadow-sm"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          ) : (
            <p className="text-sm font-bold text-slate-400">Tidak ada media yang tersedia.</p>
          )}
        </div>
      </div>
    </div>
  );
}
