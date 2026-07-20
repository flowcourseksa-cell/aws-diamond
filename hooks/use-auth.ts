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
const USER_CACHE_KEY = "tkhsas-user-cache";

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

function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCachedUser(u: AuthUser | null) {
  try {
    if (u) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {}
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    return getCachedUser();
  });
  // Read from localStorage cache immediately
  const [profile, setProfile] = useState<AuthProfile | null>(() => {
    if (typeof window === "undefined") return null;
    return getCachedProfile();
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    // If we have a cached user, we can skip the initial loading spinner
    return !getCachedUser();
  });
  // Tracks the userId we initialized for — prevents re-fetch on token refresh
  const currentUserIdRef = useRef<string | null>(null);

// Deduplicate profile fetches across all useAuth hooks to prevent 17 concurrent Server Action calls
let globalProfileFetchPromise: Promise<AuthProfile | null | undefined> | null = null;
let globalProfileFetchUserId: string | null = null;

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        console.warn("Offline: skipping profile fetch");
        return undefined;
      }
      
      // If we are already fetching for this exact user, return the same promise
      if (globalProfileFetchUserId === userId && globalProfileFetchPromise) {
        return await globalProfileFetchPromise;
      }

      globalProfileFetchUserId = userId;
      
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Profile fetch timeout")), 8000);
      });
      
      globalProfileFetchPromise = Promise.race([
        fetchProfileServer(userId),
        timeoutPromise
      ]).finally(() => clearTimeout(timeoutId));
      
      const result = await globalProfileFetchPromise;
      // Clear the promise so next time it fetches fresh data
      globalProfileFetchPromise = null;
      
      return result as AuthProfile | null;
    } catch (err) {
      console.warn("fetchProfileServer timed out or failed:", err);
      globalProfileFetchPromise = null;
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
          const userObj = { id: session.user.id, email: session.user.email || "" };
          setUser(userObj);
          setCachedUser(userObj);

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
          setCachedUser(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (typeof navigator !== "undefined" && !navigator.onLine) {
           console.warn("Offline: keeping cached session alive");
           const cachedProfile = getCachedProfile();
           const cachedUser = getCachedUser();
           if (cachedProfile && cachedUser) {
              setUser(cachedUser);
              setProfile(cachedProfile);
              currentUserIdRef.current = cachedUser.id;
           }
        }
      } finally {
        initDone = true;
        if (mounted) setIsLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
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
        setCachedUser(null);
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      // Genuinely new user signed in
      currentUserIdRef.current = newUserId;
      const userObj = { id: session.user.id, email: session.user.email || "" };
      setUser(userObj);
      setCachedUser(userObj);

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
    setCachedUser(null);
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("flow-logged-in");
      localStorage.removeItem("flow-user-role");
      localStorage.removeItem("nokhba-platform-storage-v4");
      localStorage.removeItem("tkhsas-profile-cache");
      localStorage.removeItem("tkhsas-user-cache");
      localStorage.removeItem("active_course_id");
      localStorage.removeItem("tkhsas-active-exam");
      localStorage.removeItem("flow-redirect-after-login");
    }
  }, []);

  return { user, profile, isLoading, signOut };
}
