import React, { useState } from 'react';
import { X, PackagePlus } from 'lucide-react';
import { StockItem } from '../types';

interface NewStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stock: Omit<StockItem, 'id'>) => void;
}

export const NewStockModal: React.FC<NewStockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [batch, setBatch] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [expiry, setExpiry] = useState('');
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [mrp, setMrp] = useState<number>(0);
  const [category, setCategory] = useState('Tablets');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expiryDate = new Date(expiry + 'T00:00:00');
    if (!name.trim() || !batch.trim() || !expiry || Number.isNaN(expiryDate.getTime()) || !supplier.trim() || !Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty) || !Number.isFinite(cost) || cost < 0 || !Number.isFinite(mrp) || mrp < 0) {
      window.alert('Check the medicine name, batch, expiry date, supplier, whole-unit quantity, purchase cost and MRP.');
      return;
    }

    onSubmit({
      name: name.trim(),
      strength: strength.trim(),
      batch: batch.trim().toUpperCase(),
      qty: Math.floor(Number(qty)),
      expiry,
      supplier: supplier.trim(),
      cost: Number(cost) || 0,
      mrp: Number(mrp) || 0,
      category,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Log Medicine Batch Stock
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Add new inventory batch to track shelf life and distributor returns.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Medicine Brand &amp; Generic Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Pantoprazole 40mg Tab"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Batch Number *
              </label>
              <input
                type="text"
                required
                value={batch}
                onChange={e => setBatch(e.target.value)}
                placeholder="e.g. PAN-4028"
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantity (Strips / Units) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={expiry}
                onChange={e => setExpiry(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Distributor / Wholesaler *
              </label>
              <input
                type="text"
                required
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="e.g. Shree Pharma Distributors"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unit Purchase Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost || ''}
                onChange={e => setCost(Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                MRP Retail Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={mrp || ''}
                onChange={e => setMrp(Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Log Stock Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
