"use client";

import React from "react";
import { IconX, IconTrash, IconShoppingCart } from "@tabler/icons-react";
import { useCartStore } from "@/store/cart";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem } = useCartStore();

  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <IconShoppingCart size={20} />
            </div>
            <h2 className="font-black text-2xl text-slate-800">سلة المشتريات</h2>
          </div>
          <button 
            onClick={closeCart}
            className="p-2 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 rounded-full transition-colors border border-slate-200"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <IconShoppingCart size={64} className="opacity-20" />
              <p className="font-bold text-lg">السلة فارغة حالياً</p>
              <button 
                onClick={closeCart}
                className="text-indigo-600 font-bold hover:underline"
              >
                تصفح الدورات المتاحة
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800">{item.name}</h3>
                  <p className="text-indigo-600 font-black mt-1">{item.price} ريال</p>
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <IconTrash size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-slate-500 text-lg">المجموع الكلي:</span>
              <span className="font-black text-3xl text-slate-800">{total} ريال</span>
            </div>
            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-transform hover:-translate-y-1 shadow-lg shadow-indigo-600/30">
              إتمام الدفع بأمان
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

