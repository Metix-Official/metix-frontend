'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, Search, X, ShieldCheck, Zap, Ticket, QrCode } from 'lucide-react';

interface CategorySectionProps {
  selectedCategory?: string | null;
  onSelectCategory?: (category: string | null) => void;
  apiCategories?: string[];
  searchQuery?: string;
  onClearFilters?: () => void;
  lang?: 'id' | 'en';
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  selectedCategory = null,
  onSelectCategory,
  apiCategories = [],
  searchQuery = '',
  onClearFilters,
  lang = 'id',
}) => {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const isFilterActive = Boolean(searchQuery || selectedCategory);

  const handleCategoryClick = (categoryName: string | null) => {
    if (!onSelectCategory) return;
    if (categoryName === null) {
      onSelectCategory(null);
      return;
    }
    if (selectedCategory?.toLowerCase() === categoryName.toLowerCase()) {
      onSelectCategory(null);
    } else {
      onSelectCategory(categoryName);
    }
  };

  return (
    <section id="categories" className="py-6 bg-white border-t border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        {/* Dynamic Category Chips ONLY if API database returns actual categories */}
        {apiCategories && apiCategories.length > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 flex-1 pr-2">
              <button
                type="button"
                onClick={() => handleCategoryClick(null)}
                className={`px-5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Semua Event
              </button>

              {apiCategories.map((cat: any, idx) => {
                const catName = typeof cat === 'string' ? cat : String(cat?.name || cat?.title || cat || '');
                return (
                  <button
                    key={`cat-${typeof cat === 'string' ? cat : (cat?.id || idx)}-${idx}`}
                    type="button"
                    onClick={() => handleCategoryClick(catName)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      (selectedCategory || '').toLowerCase() === catName.toLowerCase()
                        ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {catName}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border transition-all shrink-0 cursor-pointer shadow-2xs whitespace-nowrap ${
                isFilterActive
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-extrabold'
                  : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              <span>Filter</span>
            </button>
          </div>
        ) : (
          /* Premium Trust & Key Features Showcase Grid (Replaces static dummy category strip) */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3 hover:bg-slate-100/80 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-extrabold text-slate-900">Tiket 100% Resmi</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">Terhubung langsung ke mitra EO</p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3 hover:bg-slate-100/80 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-extrabold text-slate-900">Pembayaran Instan</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">QRIS, E-Wallet & Bank VA</p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3 hover:bg-slate-100/80 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Ticket className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-extrabold text-slate-900">E-Ticket PDF Cepat</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">Dikirim otomatis via email</p>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center gap-3 hover:bg-slate-100/80 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-extrabold text-slate-900">Scan QR Presisi</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">Check-in event cepat & aman</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Callout Bar */}
        {isFilterActive && (
          <div className="animate-in fade-in-0 duration-300 pt-1">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/90 border border-blue-200/90 text-blue-900 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-extrabold overflow-hidden">
                <Search className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">
                  {lang === 'en' ? 'Active Filter:' : 'Filter Aktif:'}{' '}
                  {searchQuery && (
                    <span className="text-blue-700 font-extrabold">"{searchQuery}" </span>
                  )}
                  {selectedCategory && (
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-xs ml-1 inline-block">
                      {selectedCategory}
                    </span>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={onClearFilters}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center gap-1.5 border border-blue-300/80 transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Clear Filter' : 'Hapus Filter'}</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Filter Modal Drawer */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Filter Event Metix
                </h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Selection inside Filter Modal */}
            {apiCategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                  Kategori Event
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      selectedCategory === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Semua Kategori
                  </button>
                  {apiCategories.map((cat: any, idx) => {
                    const catName = typeof cat === 'string' ? cat : String(cat?.name || cat?.title || cat || '');
                    return (
                      <button
                        key={`cat-grid-${typeof cat === 'string' ? cat : (cat?.id || idx)}-${idx}`}
                        type="button"
                        onClick={() => handleCategoryClick(catName)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          (selectedCategory || '').toLowerCase() === catName.toLowerCase()
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {catName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              {onClearFilters && (
                <button
                  type="button"
                  onClick={() => {
                    onClearFilters();
                    setIsFilterModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition-all cursor-pointer"
                >
                  Reset Filter
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                Terapkan Filter
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
