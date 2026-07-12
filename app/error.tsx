'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white p-8 text-center space-y-6 shadow-xl border-red-100 rounded-xl">
        <div className="flex justify-center">
          <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">⚠️</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">عذراً، حدث خطأ غير متوقع</h2>
          <p className="text-slate-500">
            واجهنا مشكلة فنية أثناء محاولة تحميل هذه الصفحة. فريق الدعم الفني لدينا تم إشعاره بالمشكلة.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => reset()}
            className="w-full bg-blue-600 text-white rounded-md px-4 py-3 font-semibold hover:bg-blue-700 transition"
          >
            المحاولة مرة أخرى
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-slate-100 text-slate-900 rounded-md px-4 py-3 font-semibold hover:bg-slate-200 transition"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  )
}
