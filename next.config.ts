import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
      // أضف النطاقات الخارجية التي ترفع عليها صور المنتجات هنا لمنع خطأ فك التشفير في Vercel
      remotePatterns: [
         {
            protocol: "https",
            hostname: "://cloudinary.com",
         },
         {
            protocol: "https",
            hostname: "://googleusercontent.com", // إذا كنت تستخدم تسجيل الدخول بجوجل
         },
      ],
   },
   typescript: {
      // يفضل تركها false لحل المشاكل قبل الـ Build، أو جعلها true مؤقتاً لتخطي الفحص عند الاستعجال
      ignoreBuildErrors: false,
   },
   eslint: {
      ignoreDuringBuilds: false,
   },
};

export default nextConfig;
