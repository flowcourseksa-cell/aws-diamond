"use client";

import React from "react";
import { IconSearch, IconX } from "@tabler/icons-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-4 animate-fade-in-up">
        <div className="relative flex items-center">
          <IconSearch className="absolute right-4 text-slate-400" size={24} />
          <input 
            type="text" 
            placeholder="ابحث عن الدورات، الملخصات، والمحاكيات..." 
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pr-14 pl-12 text-lg text-slate-800 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="absolute left-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="mt-4 px-4 pb-4">
          <p className="text-sm font-bold text-slate-400 mb-3">عمليات البحث الشائعة</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold cursor-pointer hover:bg-indigo-100 transition-colors">تجميعات التحصيلي 2026</span>
            <span className="px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-sm font-bold cursor-pointer hover:bg-amber-100 transition-colors">دورة الستيب المكثفة</span>
            <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold cursor-pointer hover:bg-slate-200 transition-colors">ملفات التأسيس</span>
          </div>
        </div>
      </div>
    </div>
  );
}