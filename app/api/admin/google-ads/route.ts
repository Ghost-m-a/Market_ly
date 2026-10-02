import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

const requiredSettings = [
   "GOOGLE_ADS_DEVELOPER_TOKEN",
   "GOOGLE_ADS_CLIENT_ID",
   "GOOGLE_ADS_CLIENT_SECRET",
   "GOOGLE_ADS_REFRESH_TOKEN",
   "GOOGLE_ADS_CUSTOMER_ID",
   "GOOGLE_ADS_API_VERSION",
] as const;

type GoogleCampaign = {
   id: string;
   name: string;
   status: string;
   channel: string;
};

type GoogleSettings =
   | { configured: false; missing: string[] }
   | {
        configured: true;
        developerToken: string;
        clientId: string;
        clientSecret: string;
        refreshToken: string;
        customerId: string;
        loginCustomerId?: string;
        apiVersion: string;
     };

function googleSettings(): GoogleSettings {
   const missing = requiredSettings.filter((key) => !process.env[key]);
   if (missing.length) return { configured: false, missing };
   const apiVersion = process.env.GOOGLE_ADS_API_VERSION!;
   if (!/^v\d+$/.test(apiVersion)) {
      return { configured: false, missing: ["GOOGLE_ADS_API_VERSION"] };
   }
   return {
      configured: true,
      developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      clientId: process.env.GOOGLE_ADS_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      customerId: process.env.GOOGLE_ADS_CUSTOMER_ID!.replaceAll("-", ""),
      loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replaceAll(
         "-",
         "",
      ),
      apiVersion,
   };
}

async function accessToken(
   settings: Extract<GoogleSettings, { configured: true }>,
) {
   const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
         client_id: settings.clientId,
         client_secret: settings.clientSecret,
         refresh_token: settings.refreshToken,
         grant_type: "refresh_token",
      }),
   });
   const data = (await response.json()) as { access_token?: string };
   if (!response.ok || !data.access_token)
      throw new Error("GOOGLE_AUTH_FAILED");
   return data.access_token;
}

function headers(
   settings: Extract<GoogleSettings, { configured: true }>,
   token: string,
) {
   return {
      Authorization: `Bearer ${token}`,
      "developer-token": settings.developerToken,
      ...(settings.loginCustomerId
         ? { "login-customer-id": settings.loginCustomerId }
         : {}),
      "Content-Type": "application/json",
   };
}

function failedGoogleRequest(error: unknown) {
   console.error("[google-ads] request failed:", error);
   return NextResponse.json(
      {
         message:
            "Google Ads request failed. Check account access and API configuration.",
      },
      { status: 502 },
   );
}

export async function GET() {
   const session = await getAdminSession();
   if (!session)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

   const settings = googleSettings();
   if (!settings.configured) {
      return NextResponse.json({
         configured: false,
         missing: settings.missing,
         campaigns: [],
      });
   }

   try {
      const token = await accessToken(settings);
      const response = await fetch(
         `https://googleads.googleapis.com/${settings.apiVersion}/customers/${settings.customerId}/googleAds:searchStream`,
         {
            method: "POST",
            headers: headers(settings, token),
            body: JSON.stringify({
               query: "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type FROM campaign ORDER BY campaign.id",
            }),
         },
      );
      if (!response.ok) throw new Error("GOOGLE_CAMPAIGNS_FAILED");
      const batches = (await response.json()) as {
         results?: {
            campaign?: {
               id?: string;
               name?: string;
               status?: string;
               advertisingChannelType?: string;
            };
         }[];
      }[];
      const campaigns: GoogleCampaign[] = batches.flatMap((batch) =>
         (batch.results ?? []).flatMap((result) =>
            result.campaign?.id
               ? [
                    {
                       id: result.campaign.id,
                       name: result.campaign.name ?? "Untitled campaign",
                       status: result.campaign.status ?? "UNKNOWN",
                       channel:
                          result.campaign.advertisingChannelType ?? "UNKNOWN",
                    },
                 ]
               : [],
         ),
      );
      return NextResponse.json({ configured: true, campaigns });
   } catch (error) {
      return failedGoogleRequest(error);
   }
}

export async function PATCH(req: Request) {
   const session = await getAdminSession();
   if (!session)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

   let campaignId: unknown;
   let status: unknown;
   try {
      ({ campaignId, status } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Invalid campaign action." },
         { status: 400 },
      );
   }
   if (
      typeof campaignId !== "string" ||
      !/^\d+$/.test(campaignId) ||
      (status !== "PAUSED" && status !== "ENABLED")
   ) {
      return NextResponse.json(
         { message: "Invalid campaign action." },
         { status: 400 },
      );
   }

   const settings = googleSettings();
   if (!settings.configured) {
      return NextResponse.json(
         { message: "Google Ads integration is not configured." },
         { status: 503 },
      );
   }

   try {
      const token = await accessToken(settings);
      const resourceName = `customers/${settings.customerId}/campaigns/${campaignId}`;
      const response = await fetch(
         `https://googleads.googleapis.com/${settings.apiVersion}/customers/${settings.customerId}/campaigns:mutate`,
         {
            method: "POST",
            headers: headers(settings, token),
            body: JSON.stringify({
               operations: [
                  {
                     update: { resourceName, status },
                     updateMask: "status",
                  },
               ],
            }),
         },
      );
      if (!response.ok) throw new Error("GOOGLE_CAMPAIGN_UPDATE_FAILED");
      return NextResponse.json({ ok: true, campaignId, status });
   } catch (error) {
      return failedGoogleRequest(error);
   }
}
