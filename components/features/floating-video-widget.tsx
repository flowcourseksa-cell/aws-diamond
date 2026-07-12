"use client";

import { useVideoStore } from "@/lib/video-store";
import { IconPlayerPlay, IconX } from "@tabler/icons-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

export function FloatingVideoWidget() {
  const { lastWatched, clearLastWatched } = useVideoStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Drag state
  const widgetRef = useRef<HTMLDivElement>(null);
  const position = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const bounds = useRef({ minX: -24, maxX: 1000, minY: -1000, maxY: 24 });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!lastWatched) return null;

  // Don't show the widget if we are already on the lessons page
  if (pathname.includes("/lessons")) return null;

  const progressPercent = Math.min(100, Math.max(0, (lastWatched.currentTime / (lastWatched.duration || 1)) * 100));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return; // Ignore close button
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...position.current };
    
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      bounds.current = {
        minX: position.current.x - rect.left,
        maxX: position.current.x + (window.innerWidth - rect.right),
        minY: position.current.y - rect.top,
        maxY: position.current.y + (window.innerHeight - rect.bottom),
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      hasDragged.current = true;
    }
    
    // Calculate new position
    let newX = startPos.current.x + dx;
    let newY = startPos.current.y + dy;

    newX = Math.max(bounds.current.minX, Math.min(bounds.current.maxX, newX));
    newY = Math.max(bounds.current.minY, Math.min(bounds.current.maxY, newY));

    position.current = { x: newX, y: newY };
    
    // Direct DOM manipulation for 60fps dragging (no React re-renders)
    if (widgetRef.current) {
      widgetRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!hasDragged.current) {
      router.push(`/lessons?lessonId=${lastWatched.lessonId}&autoPlay=true`);
    }
  };

  return (
    <div 
      ref={widgetRef}
      className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-500 touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
      style={{ transform: `translate(${position.current.x}px, ${position.current.y}px)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
    >
      {/* Floating Container */}
      <div 
        className="group relative flex h-[72px] w-[260px] items-center gap-3 overflow-hidden rounded-2xl bg-card border border-white/10 p-2 shadow-2xl transition-all hover:border-primary/50 hover:shadow-primary/20"
      >
        {/* Thumbnail */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black">
          {lastWatched.coverUrl ? (
            <Image src={lastWatched.coverUrl} alt="cover" fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0F1117]">
              <IconPlayerPlay size={20} className="text-white/50" />
            </div>
          )}
          
          {/* Circular Progress Overlay */}
          <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
            <circle 
              cx="50" 
              cy="50" 
              r="46" 
              fill="transparent" 
              stroke={lastWatched.trackColor || "var(--primary)"} 
              strokeWidth="8" 
              strokeDasharray="289" 
              strokeDashoffset={289 - (289 * progressPercent) / 100}
              className="transition-all duration-300"
            />
          </svg>
          
          {/* Play Icon */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <IconPlayerPlay size={24} className="text-white drop-shadow-md" fill="white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-center overflow-hidden">
          <span className="truncate text-xs font-bold text-white/60 mb-0.5" style={{ color: lastWatched.trackColor }}>
            {lastWatched.sectionName || "استكمل الدرس"}
          </span>
          <span className="truncate text-sm font-extrabold text-white">
            {lastWatched.lessonTitle}
          </span>
        </div>
      </div>

      {/* Close Button */}
      <button 
        onPointerDown={(e) => e.stopPropagation()} 
        onClick={(e) => { e.stopPropagation(); clearLastWatched(); }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/50 text-white/60 transition-colors hover:bg-red-500/20 hover:text-red-400 backdrop-blur-sm border border-white/10 cursor-pointer pointer-events-auto"
      >
        <IconX size={16} />
      </button>
    </div>
  );
}
