"use client";

import { useState, useEffect, useTransition } from "react";
import { fetchPlatformSettings, updatePlatformSetting, updateCourseFeatureOverrides, PlatformSettings } from "@/lib/supabase/services/settings";
import { fetchCourses } from "@/lib/supabase/services/courses";
import { Course } from "@/lib/store";
import { IconSettings, IconBook, IconMap2, IconBooks, IconCheck, IconX } from "@tabler/icons-react";

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    global_interactive_book: true,
    global_study_plan: true,
    global_library: true
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [fetchedSettings, fetchedCourses] = await Promise.all([
        fetchPlatformSettings(),
        fetchCourses()
      ]);
      setSettings(fetchedSettings);
      setCourses(fetchedCourses);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleGlobalToggle = async (key: keyof PlatformSettings, currentValue: boolean) => {
    const newValue = !currentValue;
    setSettings(prev => ({ ...prev, [key]: newValue }));
    await updatePlatformSetting(key, newValue);
  };

  const handleCourseOverride = async (courseId: string, featureKey: string, value: boolean | null) => {
    const updatedCourses = courses.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          featuresOverride: {
            ...(c.featuresOverride || {}),
            [featureKey]: value === null ? undefined : value
          }
        };
      }
      return c;
    });
    setCourses(updatedCourses as Course[]);
    
    const course = updatedCourses.find(c => c.id === courseId);
    if (course) {
        // We pass the full new overrides object
        const overridesToSave: Record<string, boolean | null> = {};
        if (course.featuresOverride) {
            for (const [k, v] of Object.entries(course.featuresOverride)) {
                if (v !== undefined) overridesToSave[k] = v;
            }
        }
        await updateCourseFeatureOverrides(courseId, overridesToSave);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const features = [
    { key: 'global_interactive_book', label: 'الكتاب التفاعلي', icon: <IconBook size={20} className="text-blue-500" /> },
    { key: 'global_study_plan', label: 'خطة المذاكرة', icon: <IconMap2 size={20} className="text-orange-500" /> },
    { key: 'global_library', label: 'المكتبة الشاملة', icon: <IconBooks size={20} className="text-emerald-500" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
          <IconSettings size={28} stroke={1.5} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800">الإعدادات الشاملة</h1>
          <p className="text-slate-500 mt-1">تحكم في ظهور أو إخفاء ميزات المنصة بشكل عام أو لكل دورة على حدة.</p>
        </div>
      </div>

      {/* Global Settings Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          إعدادات المنصة العامة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {feature.icon}
                </div>
                <span className="font-bold text-slate-700">{feature.label}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings[feature.key as keyof PlatformSettings]}
                  onChange={() => startTransition(() => handleGlobalToggle(feature.key as keyof PlatformSettings, settings[feature.key as keyof PlatformSettings]))}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Course Specific Settings */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6">استثناءات الدورات</h2>
        <p className="text-sm text-slate-500 mb-6">يمكنك هنا إجبار تفعيل أو إيقاف الميزة لدورة محددة، بغض النظر عن الإعداد العام للمنصة.</p>
        
        <div className="space-y-4">
          {courses.map(course => (
            <div key={course.id} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-200 transition-colors">
              <h3 className="font-bold text-lg text-slate-800 mb-4">{course.title}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: 'interactive_book', label: 'الكتاب التفاعلي' },
                  { key: 'study_plan', label: 'خطة المذاكرة' },
                  { key: 'library', label: 'المكتبة' }
                ].map(feat => {
                  const overrideValue = course.featuresOverride?.[feat.key];
                  
                  return (
                    <div key={feat.key} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-sm font-semibold text-slate-700">{feat.label}</span>
                      <div className="flex bg-slate-200/50 p-1 rounded-lg">
                        <button 
                          onClick={() => startTransition(() => handleCourseOverride(course.id, feat.key, true))}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md flex justify-center items-center gap-1 transition-all ${overrideValue === true ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-200'}`}
                        >
                          <IconCheck size={14} /> تفعيل
                        </button>
                        <button 
                          onClick={() => startTransition(() => handleCourseOverride(course.id, feat.key, null))}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${overrideValue === undefined || overrideValue === null ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-200'}`}
                        >
                          وراثة
                        </button>
                        <button 
                          onClick={() => startTransition(() => handleCourseOverride(course.id, feat.key, false))}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md flex justify-center items-center gap-1 transition-all ${overrideValue === false ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200'}`}
                        >
                          <IconX size={14} /> إيقاف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              لا توجد دورات حالياً.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
