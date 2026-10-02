import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
   const { nextUrl } = req;
   const isLoggedIn = !!req.auth;
   const userRole = req.auth?.user?.role;

   // 1. تحديد المسارات المحمية
   const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
   const isAdminRoute =
      nextUrl.pathname.startsWith("/admin") ||
      nextUrl.pathname.startsWith("/dashboard/admin");
   const isAuthRoute =
      nextUrl.pathname === "/" ||
      nextUrl.pathname === "/login" ||
      nextUrl.pathname === "/register";

   // 2. إذا كان المستخدم في مسارات تسجيل الدخول وهو مسجل بالفعل، يتم تحويله للوحة التحكم
   if (isAuthRoute) {
      if (isLoggedIn) {
         return NextResponse.redirect(new URL("/dashboard", nextUrl));
      }
      return NextResponse.next();
   }

   // 3. حماية مسارات لوحة التحكم العامة (يجب أن يكون مسجل دخول)
   if (isDashboardRoute && !isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl)); // تحويل لصفحة تسجيل الدخول الرئيسية
   }

   // 4. حماية مسارات المسؤول الصارمة (Admin)
   if (isAdminRoute) {
      if (!isLoggedIn) {
         return NextResponse.redirect(new URL("/", nextUrl));
      }
      if (userRole !== "ADMIN") {
         return NextResponse.redirect(new URL("/dashboard", nextUrl)); // تحويل للمستخدم العادي إذا لم يكن أدمن
      }
   }

   return NextResponse.next();
});

// إعداد الـ Matcher لتشغيل الـ Middleware على كل المسارات عدا الملفات الثابتة والأيقونات
export const config = {
   matcher: [
      "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.svg|.*\\.png|.*\\.jpg).*)",
   ],
};
