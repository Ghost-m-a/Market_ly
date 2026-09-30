import type { Metadata } from "next";
// @ts-expect-error Next.js processes this global stylesheet import at build time.
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
   title: "Whop",
   description: "The platform for creators and businesses.",
};

export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <html lang="en" suppressHydrationWarning>
         <head>
            <script
               dangerouslySetInnerHTML={{
                  __html: `try{var s=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=s||(p?'dark':'light')}catch(e){}`,
               }}
            />
         </head>
         <body>
            <AuthProvider>
               <Header />
               <AppShell>{children}</AppShell>
            </AuthProvider>
         </body>
      </html>
   );
}
