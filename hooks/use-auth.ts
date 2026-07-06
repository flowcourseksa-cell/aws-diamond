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
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .limit(1)
        .single();

      if (error) {
        console.warn("Profile fetch error (might not exist yet):", error.message);
        return null;
      }
      return data as AuthProfile;
    } catch (err) {
      console.error("fetchProfile error:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    // BUG-31: prevent double initialization when onAuthStateChange fires during init()
    let initDone = false;

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
        initDone = true;
        if (mounted) setIsLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, session ? "Session exists" : "No session");
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
      } else {
        // If there's an event (like INITIAL_SESSION) but no user, we must ensure loading is false
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("flow-logged-in");
      localStorage.removeItem("flow-user-role");
    }
  }, []);

  return { user, profile, isLoading, signOut };
}
