import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  CheckCircle2,
  FileText,
  Download,
} from 'lucide-react';
import { Order } from '../types';

interface PrescriptionModalProps {
  order: Order | null;
  onClose: () => void;
  onVerify: (orderId: number, isVerified: boolean) => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  order,
  onClose,
  onVerify,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  if (!order) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0 gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-[10px] sm:text-xs font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                #{order.orderNumber}
              </span>
              <h3 className="text-xs sm:text-base font-bold text-slate-900 truncate">
                Rx Inspection Desk
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              Patient: <strong className="text-slate-800">{order.customerName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => onVerify(order.id, !order.isVerified)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                order.isVerified
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{order.isVerified ? 'Rx Verified ✓' : 'Mark as Verified'}</span>
              <span className="sm:hidden">{order.isVerified ? 'Verified' : 'Verify'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 bg-slate-100 border-b border-slate-200 text-xs text-slate-600 shrink-0 gap-2 overflow-x-auto touch-scroll">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleZoomIn}
              className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md cursor-pointer font-medium text-xs"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>In</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md cursor-pointer font-medium text-xs"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              <span>Out</span>
            </button>
            <button
              onClick={handleRotate}
              className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md cursor-pointer font-medium text-xs"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate</span>
            </button>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`flex items-center gap-1 px-2 py-1 border rounded-md cursor-pointer font-medium text-xs ${
                highContrast
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Enhance contrast for faint handwriting"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Contrast</span>
            </button>
          </div>

          <div className="tabular-nums font-mono text-[10px] sm:text-[11px] text-slate-500 shrink-0">
            {Math.round(zoom * 100)}% · {rotation}°
          </div>
        </div>

        {/* Prescription Viewer Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-slate-900/5 flex items-center justify-center min-h-[420px]">
          {order.prescriptionUrl ? (
            <div
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                filter: highContrast ? 'contrast(170%) brightness(95%)' : 'none',
                transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                transformOrigin: 'center center',
              }}
              className="max-w-full max-h-full flex items-center justify-center shadow-lg rounded-lg overflow-hidden bg-white"
            >
              <img
                src={order.prescriptionUrl}
                alt="Doctor Prescription"
                className="max-h-[600px] w-auto object-contain pointer-events-none select-none"
              />
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No image attachment provided for this order.</p>
            </div>
          )}
        </div>

        {/* Modal Footer with Notes & Bill info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-600 line-clamp-1">
            <strong>Order notes:</strong> {order.itemsSummary}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Prescription status:{' '}
              <strong className={order.isVerified ? 'text-emerald-700' : 'text-amber-700'}>
                {order.isVerified ? 'Verified by Pharmacist' : 'Pending Verification'}
              </strong>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
