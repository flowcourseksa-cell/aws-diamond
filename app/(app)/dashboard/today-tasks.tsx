"use client";

import { useState } from "react";
import { IconCheck } from "@tabler/icons-react";
import { usePlatformStore } from "@/lib/store";
import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";

type FlowTask = { id: string; trackId: string; title: string; time: string; isDone: boolean };

const INITIAL: FlowTask[] = [
  { id: "ft1", trackId: "qudrat-komi",  title: "مراجعة المعادلات الخطية",       time: "09:00", isDone: true  },
  { id: "ft2", trackId: "qudrat-lafzi", title: "حل 15 سؤال مفردة شاذة",         time: "11:00", isDone: true  },
  { id: "ft3", trackId: "qudrat-komi",  title: "تمارين الاحتمالات — مهارة ضعيفة",time: "14:00", isDone: false },
  { id: "ft4", trackId: "qudrat-lafzi", title: "مراجعة الاستنتاج في المقروء",    time: "16:00", isDone: false },
  { id: "ft5", trackId: "tasis",   title: "الكسور والنسب المئوية",          time: "18:00", isDone: false },
];

export function TodayTasks() {
  const [isMounted, setIsMounted] = useState(false);
  const storeTracks = usePlatformStore(s => s.tracks);
  
  useEffect(() => setIsMounted(true), []);

  const [tasks, setTasks] = useState<FlowTask[]>(INITIAL);
  const { showToast } = useToast();

  function toggle(id: string) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, isDone: !t.isDone };
      if (updated.isDone) showToast("أحسنت! تم إنجاز المهمة", "success");
      return updated;
    }));
  }

  if (!isMounted) return <div className="p-8 text-center text-text-muted font-bold">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-2.5">
      {tasks.map(task => {
        const track = storeTracks.find(t => t.id === task.trackId) ?? { color: "#6366f1" };
        return (
        <div
          key={task.id}
          className={`flex items-center gap-3 rounded-xl border border-border px-3.5 py-3.25 transition-colors duration-200 hover:border-primary ${task.isDone ? "opacity-55" : ""}`}
        >
          <button
            onClick={() => toggle(task.id)}
            aria-label={task.isDone ? "إلغاء إنجاز المهمة" : "إنجاز المهمة"}
            className={`pop flex h-5.5 w-5.5 flex-shrink-0 items-center justify-center rounded-[7px] border-2 text-[13px] transition-colors duration-200 ${
              task.isDone ? "border-accent-teal bg-accent-teal text-white" : "border-border text-transparent"
            }`}
          >
            <IconCheck size={14} />
          </button>
          <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: track.color }} />
          <span className={`flex-1 text-[13.5px] font-semibold ${task.isDone ? "line-through" : ""}`}>
            {task.title}
          </span>
          <span className="text-xs font-semibold text-text-muted">{task.time}</span>
        </div>
        );
      })}
    </div>
  );
}

