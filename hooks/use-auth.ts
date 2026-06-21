import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      
      // Attempt to load from cache first for instant UI response
      const cached = localStorage.getItem(`flow-profile-${userId}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
        } catch (e) {}
      }

      const result = await Promise.race([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 5000)
        ),
      ]);
      const { data, error } = result as { data: AuthProfile | null; error: { message: string } | null };

      if (error) {
        console.warn("Profile fetch error (might not exist yet):", error.message);
        // If there's an error (e.g. timeout or no internet) but we have cache, DO NOT return null.
        if (cached) return JSON.parse(cached);
        return null;
      }
      
      if (data) {
        localStorage.setItem(`flow-profile-${userId}`, JSON.stringify(data));
      }
      return data as AuthProfile;
    } catch (err) {
      console.error("fetchProfile error:", err);
      // Fallback to cache on hard throw
      const cached = localStorage.getItem(`flow-profile-${userId}`);
      if (cached) return JSON.parse(cached);
      return null;
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const authUser = { id: session.user.id, email: session.user.email || "" };
          setUser(authUser);

          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        const authUser = { id: session.user.id, email: session.user.email || "" };
        setUser(authUser);

        const profileData = await fetchProfile(session.user.id);
        if (mounted) {
          setProfile(profileData);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign out ONLY after the user re-confirms their own password.
  // Returns true on success, false if the password is wrong / fails.
  const signOut = useCallback(async (password?: string): Promise<boolean> => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email;

    // Require password confirmation before logging out.
    if (!password || !email) return false;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return false; // wrong password -> do NOT sign out

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("flow-logged-in");
      localStorage.removeItem("flow-user-role");
      if (session?.user?.id) {
        localStorage.removeItem(`flow-profile-${session.user.id}`);
      }
    }
    return true;
  }, []);

  return { user, profile, isLoading, signOut };
}
