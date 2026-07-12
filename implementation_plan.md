# Fix Progress Reset and Dashboard Stats

The user reported three main issues:
1. **Progress Reset**: When reloading the page or returning, progress resets as if no lessons were watched, but exam attempts remain.
2. **Skills Misreported as Average**: Skills are showing as "متوسطة" (Average) even when they are "قوية" (Strong) or haven't been started.
3. **Final Exam UI Confusion**: The Final Exam UI shows "إكمال الدروس" (Complete lessons) which confuses the user since they already completed them.

## Proposed Changes

### 1. Fix Dashboard Stats (`app/(app)/dashboard/dashboard-client.tsx`)
Currently, `completedLessonsCount` and `studyHours` are hardcoded to `0`. Also, the calculation for "Average" skills is `totalSkills - masteredSkills - weakSkillsCount`, which incorrectly lumps all `not_started` skills into the "Average" category, inflating the number and making the user think they dropped in score.

#### [MODIFY] `app/(app)/dashboard/dashboard-client.tsx`
- Replace hardcoded `0` with actual calculations based on `lessons` array from the Zustand store.
- Fix the logic for `averageSkillsCount` to only count `sk.status === "average"`.
- Add a new block to show `not_started` skills clearly.

### 2. Fix Progress Wipe in App Shell (`components/layout/app-shell.tsx`)
Currently, `loadData()` fetches the tracks, sets them (with 0 progress), and *then* fetches user progress. If the progress fetch fails, the state remains at 0, permanently wiping the user's local cache. Even if it succeeds, there is a split-second UI flicker where progress is 0.

#### [MODIFY] `components/layout/app-shell.tsx`
- Refactor `loadData` to run `Promise.all` that includes both `fetchHierarchyByCourse` AND `fetchUserProgress(user.id)`.
- If `fetchUserProgress` fails (e.g. offline), we will manually extract the progress from the *existing* Zustand store and inject it into the new tracks/lessons before calling `setTracks` and `setLessons`.
- This ensures `setTracks` is called exactly once with the fully hydrated data.

### 3. Clarify Final Exam UI (`app/(app)/final-exam/[courseId]/page.tsx`)
The user is confused because the unlock UI shows requirements in a way that suggests they still need to do them, even if completed.

#### [MODIFY] `app/(app)/final-exam/[courseId]/page.tsx`
- Add a green checkmark next to requirements that are already met.
- Change the wording to clearly indicate if a requirement is "مكتمل" (Completed).

## Verification Plan
- Run the web app and verify the dashboard reflects actual completed lessons.
- Verify that `not_started` skills are not grouped under "متوسطة".
- Check `app-shell.tsx` rendering to ensure no flicker or wipe of data on refresh.
- Check the Final exam page UI.