import { Suspense } from "react";
import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-text-muted">جاري تحميل الداشبورد...</div>}>
      <DashboardClient />
    </Suspense>
  );
}

