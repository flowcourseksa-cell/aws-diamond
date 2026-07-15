import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchProfileServer } from "@/lib/supabase/services/students";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthProfile = {
  id: string;
  full_name: string;
  role: "admin" | "student";
  phone: string | null;
  parent_phone: string | null;
  is_banned_from_comments?: boolean;
};

const PROFILE_CACHE_KEY = "tkhsas-profile-cache";

function getCachedProfile(): AuthProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCachedProfile(p: AuthProfile | null) {
  try {
    if (p) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p));
    else localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {}
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Read from localStorage cache immediately — eliminates the "طالب جديد" flash
  const [profile, setProfile] = useState<AuthProfile | null>(() => {
    if (typeof window === "undefined") return null;
    return getCachedProfile();
  });
  const [isLoading, setIsLoading] = useState(true);
  // Tracks the userId we initialized for — prevents re-fetch on token refresh
  const currentUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        console.warn("Offline: skipping profile fetch");
        return undefined;
      }
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Profile fetch timeout")), 8000);
      });
      const result = await Promise.race([
        fetchProfileServer(userId),
        timeoutPromise
      ]).finally(() => clearTimeout(timeoutId));
      return result as AuthProfile | null;
    } catch (err) {
      console.warn("fetchProfileServer timed out or failed:", err);
      return undefined;
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    let initDone = false;

    // Safety timeout
    const fallbackTimeout = setTimeout(() => {
      if (mounted && !initDone) setIsLoading(false);
    }, 10000);

    async function init() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mounted) return;

        if (session?.user) {
          currentUserIdRef.current = session.user.id;
          setUser({ id: session.user.id, email: session.user.email || "" });

          // Fetch fresh profile from server
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            // Only redirect to onboarding for truly new accounts (no full_name set yet)
            if (profileData && !profileData.full_name && window.location.pathname !== '/onboarding') {
              window.location.href = '/onboarding';
              return;
            }
            if (profileData !== undefined) { // Check if not a network error
              if (profileData) {
                setCachedProfile(profileData);
                setProfile(profileData);
              } else {
                // Profile not found at all — might be new user, clear cache
                setCachedProfile(null);
              }
            } else {
               // Network error (profileData === undefined)
               const cached = getCachedProfile();
               if (cached) setProfile(cached);
            }
          }
        } else {
          currentUserIdRef.current = null;
          setCachedProfile(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (typeof navigator !== "undefined" && !navigator.onLine) {
           console.warn("Offline: keeping cached session alive");
           const cached = getCachedProfile();
           if (cached) {
              setUser({ id: cached.id, email: "" });
              setProfile(cached);
              currentUserIdRef.current = cached.id;
           }
        }
      } finally {
        initDone = true;
        if (mounted) setIsLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const newUserId = session?.user?.id ?? null;

      // KEY FIX: TOKEN_REFRESHED / INITIAL_SESSION fire on every tab focus.
      // Ignore them if the userId hasn't changed — no need to re-fetch anything.
      if (newUserId === currentUserIdRef.current && event !== "SIGNED_OUT") {
        return;
      }

      if (event === "SIGNED_OUT" || !session?.user) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
           console.warn("Offline: ignoring auth state change that looks like logout");
           return;
        }
        currentUserIdRef.current = null;
        setCachedProfile(null);
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      // Genuinely new user signed in
      currentUserIdRef.current = newUserId;
      setUser({ id: session.user.id, email: session.user.email || "" });

      const profileData = await fetchProfile(session.user.id);
      if (mounted) {
        // Only redirect to onboarding for truly new accounts (no full_name set yet)
        if (profileData && !profileData.full_name && window.location.pathname !== '/onboarding') {
          window.location.href = '/onboarding';
          return;
        }
        if (profileData !== undefined) {
          if (profileData) {
            setCachedProfile(profileData);
            setProfile(profileData);
          } else {
            setCachedProfile(null);
          }
        }
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(fallbackTimeout);
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCachedProfile(null);
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("flow-logged-in");
      localStorage.removeItem("flow-user-role");
      localStorage.removeItem("nokhba-platform-storage-v4");
      localStorage.removeItem("tkhsas-profile-cache");
      localStorage.removeItem("active_course_id");
      localStorage.removeItem("tkhsas-active-exam");
      localStorage.removeItem("flow-redirect-after-login");
    }
  }, []);

  return { user, profile, isLoading, signOut };
}
