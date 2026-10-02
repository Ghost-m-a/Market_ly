import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
   adapter: PrismaAdapter(prisma),
   session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
   trustHost: true,

   providers: [
      ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
         ? [
              Google({
                 clientId: process.env.AUTH_GOOGLE_ID,
                 clientSecret: process.env.AUTH_GOOGLE_SECRET,
                 allowDangerousEmailAccountLinking: true,
              }),
           ]
         : []),
      ...(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
         ? [
              Facebook({
                 clientId: process.env.AUTH_FACEBOOK_ID,
                 clientSecret: process.env.AUTH_FACEBOOK_SECRET,
                 allowDangerousEmailAccountLinking: true,
              }),
           ]
         : []),
      Credentials({
         name: "Credentials",
         credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
         },
         async authorize(credentials) {
            const email = String(credentials?.email ?? "")
               .trim()
               .toLowerCase();
            const password = String(credentials?.password ?? "");
            if (!email || !password) return null;

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return null;
            if (!user.emailVerified) {
               throw new Error("Verify your email address before signing in.");
            }
            if (!user.passwordHash) {
               throw new Error(
                  "This account was created with Google or Facebook. Sign in with those instead.",
               );
            }
            if (!verifyPassword(password, user.passwordHash)) return null;

            return {
               id: user.id,
               name: user.name,
               email: user.email,
               image: user.image ?? undefined,
               role: user.role,
            };
         },
      }),
   ],

   callbacks: {
      async jwt({ token, user }) {
         if (user) {
            token.id = user.id;
            token.role = user.role;
         }
         return token;
      },
      async session({ session, token }) {
         if (session.user) {
            session.user.id = (token.id as string) ?? token.sub!;
            session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
         }
         return session;
      },
      async redirect({ url, baseUrl }) {
         if (url.startsWith("/")) return `${baseUrl}${url}`;
         if (new URL(url).origin === baseUrl) return url;
         return `${baseUrl}/dashboard`;
      },
   },

   pages: { signIn: "/", error: "/" },
   secret: process.env.AUTH_SECRET,
});
