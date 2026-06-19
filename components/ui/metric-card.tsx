import type { ReactNode } from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

type MetricCardProps = {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  value: ReactNode;
  label: string;
  trend?: { value: string; direction: "up" | "down" };
  delay?: 1 | 2 | 3 | 4;
};

export function MetricCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  trend,
  delay,
}: MetricCardProps) {
  return (
    <div
      className={`fade-up ${delay ? `delay-${delay}` : ""} flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.75 hover:shadow-[0_8px_24px_rgba(15,17,23,0.05)]`}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-10.5 w-10.5 items-center justify-center rounded-xl text-xl"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 rounded-lg px-2 py-0.75 text-xs font-bold ${
              trend.direction === "up"
                ? "bg-accent-teal-light text-accent-teal"
                : "bg-accent-red-light text-accent-red"
            }`}
          >
            {trend.direction === "up" ? (
              <IconTrendingUp size={14} />
            ) : (
              <IconTrendingDown size={14} />
            )}
            {trend.value}
          </div>
        )}
      </div>
      <div className="text-[28px] font-black">{value}</div>
      <div className="text-[13px] font-semibold text-text-muted">{label}</div>
    </div>
  );
}
