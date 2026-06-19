export function ProgressBar({
  percent,
  color = "var(--primary)",
}: {
  percent: number;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="h-2 w-full overflow-hidden rounded-[10px] border border-border bg-bg">
      <div
        className="h-full rounded-[10px] transition-[width] duration-1000 ease-out"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}
