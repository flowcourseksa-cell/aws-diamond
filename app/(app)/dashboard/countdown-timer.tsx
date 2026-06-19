"use client";

import { useEffect, useState } from "react";

function getRemaining(targetDate: string) {
  const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetDate));

  useEffect(() => {
    const interval = setInterval(() => setRemaining(getRemaining(targetDate)), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const units: { value: number; label: string }[] = [
    { value: remaining.days, label: "يوم" },
    { value: remaining.hours, label: "ساعة" },
    { value: remaining.minutes, label: "دقيقة" },
    { value: remaining.seconds, label: "ثانية" },
  ];

  return (
    <div className="flex gap-2.5">
      {units.map((unit) => (
        <div key={unit.label} className="min-w-15.5 rounded-xl border border-border bg-bg px-3.5 py-3 text-center">
          <div className="text-2xl font-black text-primary">{String(unit.value).padStart(2, "0")}</div>
          <div className="mt-0.5 text-[11px] font-semibold text-text-muted">{unit.label}</div>
        </div>
      ))}
    </div>
  );
}
