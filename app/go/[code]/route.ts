import { NextResponse } from "next/server";
import { getMongoDatabase } from "@/lib/mongodb";

type AffiliateLinkRecord = {
   code: string;
   destination: string;
   clicks: number;
};

export async function GET(
   _req: Request,
   { params }: { params: Promise<{ code: string }> },
) {
   const { code } = await params;
   if (!/^[a-zA-Z0-9_-]{8,24}$/.test(code)) {
      return new Response("Link not found.", { status: 404 });
   }

   try {
      const links = (await getMongoDatabase()).collection<AffiliateLinkRecord>(
         "affiliateLinks",
      );
      const link = await links.findOne({ code });
      if (!link) return new Response("Link not found.", { status: 404 });

      await links.updateOne({ _id: link._id }, { $inc: { clicks: 1 } });
      return NextResponse.redirect(link.destination, 302);
   } catch (error) {
      console.error("[affiliate redirect] error:", error);
      return new Response("Affiliate link service is unavailable.", {
         status: 503,
      });
   }
}
