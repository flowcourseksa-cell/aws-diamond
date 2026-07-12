import { AppShell } from "@/components/layout/app-shell";
import { FloatingVideoWidget } from "@/components/features/floating-video-widget";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <FloatingVideoWidget />
    </>
  );
}

