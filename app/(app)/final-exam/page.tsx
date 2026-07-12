"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FinalExamRedirect() {
  const router = useRouter();

  useEffect(() => {
    const activeCourseId = localStorage.getItem("active_course_id");
    if (activeCourseId) {
      router.replace(`/final-exam/${activeCourseId}`);
    } else {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
