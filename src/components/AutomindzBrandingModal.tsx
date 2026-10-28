import React from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Cpu, Code2, HeartHandshake } from 'lucide-react';

interface AutomindzBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomindzBrandingModal: React.FC<AutomindzBrandingModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-teal-900 text-white shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-teal-800 text-teal-200">
              <Sparkles className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                Automindz Digital Labs
              </h3>
              <p className="text-[11px] sm:text-xs text-teal-200 mt-0.5">
                RefillDesk — Medical Store Operating System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-200 hover:text-white hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs text-slate-600 overflow-y-auto flex-1">
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              About RefillDesk
            </h4>
            <p className="leading-relaxed">
              RefillDesk was engineered by <strong>Automindz Digital Labs</strong> specifically for retail medical stores, community pharmacies, and chemist dispensaries. It replaces manual paper registers with an automated chronic patient refill scheduler, WhatsApp prescription queue, wholesaler expiry claim sheet generator, and patient credit ledger.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h5 className="font-bold text-slate-900 text-xs">
              System Capabilities &amp; Architecture:
            </h5>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Cost WhatsApp Links:</strong> Direct 1-click <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-[11px]">wa.me</code> messaging without paying Meta per-message fees or requiring business approvals.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Automated 9:00 AM Cron Engine:</strong> Runs scheduled morning scans to proactively identify chronic patients whose medicines expire in 3 days.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Doctor Prescription Inspection:</strong> High-resolution inspection desk with 200% zoom, rotation, and high-contrast filters for faint handwriting.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Distributor Return Claims:</strong> Auto-groups near-expiry medicines by wholesale supplier and generates downloadable CSV claim sheets for credit notes.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Offline-First Resilience:</strong> Works completely offline with persistent local storage, data backup, and export capabilities.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-teal-50 border border-teal-200/80 rounded-xl text-teal-900">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-teal-700" />
              <div>
                <div className="font-bold text-xs">Crafted with Precision</div>
                <div className="text-[11px] text-teal-700">Automindz Digital Labs Medical Suite</div>
              </div>
            </div>
            <span className="text-[11px] font-mono font-semibold bg-white px-2.5 py-1 rounded-md border border-teal-200 text-teal-900">
              v1.0.0 Production
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
