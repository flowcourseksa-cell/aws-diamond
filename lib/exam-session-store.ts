/**
 * Exam Session Persistence
 * Saves and restores in-progress exam state to localStorage
 * so the student can resume after accidental browser close/refresh.
 */

const KEY = "tkhsas-active-exam";

export type ActiveExamSession = {
  examId: string;
  /** ISO timestamp when the exam actually STARTED (stage moved to "exam") */
  startedAt: string;
  /** Total duration in seconds */
  totalSeconds: number;
  currentQ: number;
  answers: (number | null)[];
};

export function saveExamSession(session: ActiveExamSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function loadExamSession(): ActiveExamSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session: ActiveExamSession = JSON.parse(raw);

    // Calculate remaining seconds from wall clock
    const elapsed = Math.floor(
      (Date.now() - new Date(session.startedAt).getTime()) / 1000
    );
    const remaining = session.totalSeconds - elapsed;

    // If time already expired, clear and return null
    if (remaining <= 0) {
      clearExamSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/** Returns actual remaining seconds based on wall-clock elapsed time */
export function getRemainingSeconds(session: ActiveExamSession): number {
  const elapsed = Math.floor(
    (Date.now() - new Date(session.startedAt).getTime()) / 1000
  );
  return Math.max(0, session.totalSeconds - elapsed);
}

export function clearExamSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
