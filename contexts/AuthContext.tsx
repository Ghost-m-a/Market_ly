"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

export type AuthUser = {
   id: string;
   name: string;
   email: string;
   avatarUrl?: string; // kept for backward compat with existing components
};

type AuthContextValue = {
   user: AuthUser | null;
   loading: boolean;
   login: (email: string, password: string) => Promise<void>;
   signup: (name: string, email: string, password: string) => Promise<void>;
   logout: () => Promise<void>;
   refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/* ---------------- Inner provider (has access to useSession) --------------- */

function AuthContextInner({ children }: { children: ReactNode }) {
   const { data: session, status, update } = useSession();

   const loading = status === "loading";

   const user: AuthUser | null = session?.user
      ? {
           id: session.user.id,
           name: session.user.name ?? "",
           email: session.user.email ?? "",
           avatarUrl: session.user.image ?? undefined, // ← the bridge
        }
      : null;

   const login = useCallback(async (email: string, password: string) => {
      const res = await signIn("credentials", {
         email,
         password,
         redirect: false,
      });

      if (!res) throw new Error("Login failed.");
      if (res.error) {
         // NextAuth wraps authorize() errors in `error`
         throw new Error(
            res.error === "CredentialsSignin"
               ? "Invalid email or password."
               : res.error,
         );
      }
   }, []);

   const signup = useCallback(
      async (name: string, email: string, password: string) => {
         // 1. Create the user via our own API (NextAuth Credentials doesn't create users)
         const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
         });

         const data = await res.json();
         if (!res.ok)
            throw new Error(data.message ?? "Could not create account.");

         // 2. Sign them in immediately
         const signInRes = await signIn("credentials", {
            email,
            password,
            redirect: false,
         });

         if (!signInRes || signInRes.error) {
            throw new Error(
               "Account created, but sign-in failed. Please log in manually.",
            );
         }
      },
      [],
   );

   const logout = useCallback(async () => {
      await signOut({ redirect: false });
   }, []);

   const refresh = useCallback(async () => {
      await update();
   }, [update]);

   return (
      <AuthContext.Provider
         value={{ user, loading, login, signup, logout, refresh }}
      >
         {children}
      </AuthContext.Provider>
   );
}

/* ---------------- Outer provider (wraps SessionProvider) ----------------- */

export function AuthProvider({ children }: { children: ReactNode }) {
   return (
      <SessionProvider>
         <AuthContextInner>{children}</AuthContextInner>
      </SessionProvider>
   );
}

export function useAuth() {
   const ctx = useContext(AuthContext);
   if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
   return ctx;
}
