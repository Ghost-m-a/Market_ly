"use client";

import { useEffect, useState } from "react";
import CreateCampaignModal from "@/components/campaigns/CreateCampaignModal";
import CampaignDetailModal from "@/components/campaigns/CampaignDetailModal";
import type { CampaignDetail, CampaignSummary } from "@/lib/campaigns";
import styles from "./admin.module.css";

type AdminCampaign = CampaignSummary & {
   creatorName: string;
   creatorEmail: string;
};

type AdminUser = {
   id: string;
   name: string;
   email: string;
   role: "USER" | "ADMIN";
   emailVerified: string | null;
   createdAt: string;
   creditsBalance: number;
   _count: { campaigns: number };
};

type GoogleAdsCampaign = {
   id: string;
   name: string;
   status: string;
   channel: string;
};

export default function AdminConsole() {
   const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
   const [users, setUsers] = useState<AdminUser[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
      null,
   );
   const [editingCampaign, setEditingCampaign] =
      useState<CampaignDetail | null>(null);
   const [createOpen, setCreateOpen] = useState(false);
   const [googleAdsConfigured, setGoogleAdsConfigured] = useState(false);
   const [googleAdsMissing, setGoogleAdsMissing] = useState<string[]>([]);
   const [googleAdsCampaigns, setGoogleAdsCampaigns] = useState<
      GoogleAdsCampaign[]
   >([]);
   const [googleAdsLoading, setGoogleAdsLoading] = useState(true);
   const [googleAdsError, setGoogleAdsError] = useState("");
   const [creditRate, setCreditRate] = useState("");
   const [pricingLoading, setPricingLoading] = useState(true);
   const [pricingSaving, setPricingSaving] = useState(false);
   const [pricingError, setPricingError] = useState("");

   const loadOverview = async () => {
      setError("");
      try {
         const response = await fetch("/api/admin/overview", {
            cache: "no-store",
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not load admin data.");
         setCampaigns(data.campaigns ?? []);
         setUsers(data.users ?? []);
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not load admin data.",
         );
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      void loadOverview();
      void loadGoogleAds();
      void loadPricing();
   }, []);

   const loadPricing = async () => {
      setPricingLoading(true);
      setPricingError("");
      try {
         const response = await fetch("/api/admin/pricing", {
            cache: "no-store",
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not load pricing.");
         setCreditRate(String(data.creditsPerThousandViews ?? 0));
      } catch (err) {
         setPricingError(
            err instanceof Error ? err.message : "Could not load pricing.",
         );
      } finally {
         setPricingLoading(false);
      }
   };

   const savePricing = async () => {
      setPricingSaving(true);
      setPricingError("");
      try {
         const response = await fetch("/api/admin/pricing", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               creditsPerThousandViews: Number(creditRate),
            }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not save pricing.");
         setCreditRate(String(data.creditsPerThousandViews));
      } catch (err) {
         setPricingError(
            err instanceof Error ? err.message : "Could not save pricing.",
         );
      } finally {
         setPricingSaving(false);
      }
   };

   const grantCredits = async (user: AdminUser) => {
      const rawAmount = window.prompt(`Credits to grant to ${user.email}:`);
      if (rawAmount === null) return;
      const amount = Number(rawAmount);
      if (!Number.isSafeInteger(amount) || amount <= 0) {
         setError("Credit grants must be positive whole numbers.");
         return;
      }
      setError("");
      try {
         const response = await fetch("/api/admin/credits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, amount }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not grant credits.");
         setUsers((current) =>
            current.map((item) =>
               item.id === user.id
                  ? { ...item, creditsBalance: data.balance }
                  : item,
            ),
         );
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not grant credits.",
         );
      }
   };

   const loadGoogleAds = async () => {
      setGoogleAdsLoading(true);
      setGoogleAdsError("");
      try {
         const response = await fetch("/api/admin/google-ads", {
            cache: "no-store",
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not load Google Ads.");
         setGoogleAdsConfigured(data.configured === true);
         setGoogleAdsMissing(data.missing ?? []);
         setGoogleAdsCampaigns(data.campaigns ?? []);
      } catch (err) {
         setGoogleAdsError(
            err instanceof Error ? err.message : "Could not load Google Ads.",
         );
      } finally {
         setGoogleAdsLoading(false);
      }
   };

   const setGoogleAdsStatus = async (campaign: GoogleAdsCampaign) => {
      const status = campaign.status === "ENABLED" ? "PAUSED" : "ENABLED";
      setGoogleAdsError("");
      try {
         const response = await fetch("/api/admin/google-ads", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campaignId: campaign.id, status }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(
               data.message ?? "Could not update Google campaign.",
            );
         setGoogleAdsCampaigns((current) =>
            current.map((item) =>
               item.id === campaign.id
                  ? { ...item, status: data.status }
                  : item,
            ),
         );
      } catch (err) {
         setGoogleAdsError(
            err instanceof Error
               ? err.message
               : "Could not update Google campaign.",
         );
      }
   };

   const setCampaignStatus = async (campaign: AdminCampaign) => {
      const status = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
      setError("");
      try {
         const response = await fetch(`/api/campaigns/${campaign.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not update campaign.");
         setCampaigns((current) =>
            current.map((item) =>
               item.id === campaign.id ? { ...item, ...data.campaign } : item,
            ),
         );
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not update campaign.",
         );
      }
   };

   const removeCampaign = async (campaign: AdminCampaign) => {
      if (!window.confirm(`Remove “${campaign.title}”?`)) return;
      setError("");
      try {
         const response = await fetch(`/api/campaigns/${campaign.id}`, {
            method: "DELETE",
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not remove campaign.");
         await loadOverview();
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not remove campaign.",
         );
      }
   };

   const closeEditor = () => {
      setEditingCampaign(null);
      setCreateOpen(false);
   };

   return (
      <main className={styles.page}>
         <header className={styles.header}>
            <div>
               <h1>Admin console</h1>
               <p>Platform accounts and campaign controls</p>
            </div>
            <button
               type="button"
               className={styles.primaryButton}
               onClick={() => setCreateOpen(true)}
            >
               Add campaign
            </button>
         </header>

         {error && (
            <p className={styles.error} role="alert">
               {error}
            </p>
         )}
         {loading ? (
            <p className={styles.loading}>Loading platform data…</p>
         ) : (
            <>
               <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                     <h2>Campaigns</h2>
                     <span>{campaigns.length} total</span>
                  </div>
                  <div className={styles.tableScroll}>
                     <table>
                        <thead>
                           <tr>
                              <th>Campaign</th>
                              <th>Owner</th>
                              <th>Status</th>
                              <th>Views</th>
                              <th>Target</th>
                              <th>Credits</th>
                              <th>Budget</th>
                              <th>Actions</th>
                           </tr>
                        </thead>
                        <tbody>
                           {campaigns.map((campaign) => (
                              <tr key={campaign.id}>
                                 <td>
                                    <strong>{campaign.title}</strong>
                                    <span className={styles.secondary}>
                                       {campaign.brandName}
                                    </span>
                                 </td>
                                 <td>
                                    <strong>{campaign.creatorName}</strong>
                                    <span className={styles.secondary}>
                                       {campaign.creatorEmail}
                                    </span>
                                 </td>
                                 <td>
                                    <span className={styles.status}>
                                       {campaign.status}
                                    </span>
                                 </td>
                                 <td>{campaign.totalViews.toLocaleString()}</td>
                                 <td>
                                    {campaign.targetViews.toLocaleString()}
                                 </td>
                                 <td>
                                    {campaign.campaignCostCredits.toLocaleString()}
                                 </td>
                                 <td>
                                    ${(campaign.budgetCents / 100).toFixed(2)}
                                 </td>
                                 <td>
                                    <div className={styles.actions}>
                                       <button
                                          type="button"
                                          onClick={() =>
                                             setSelectedCampaignId(campaign.id)
                                          }
                                       >
                                          Open
                                       </button>
                                       <button
                                          type="button"
                                          onClick={() =>
                                             void setCampaignStatus(campaign)
                                          }
                                          disabled={
                                             campaign.status !== "ACTIVE" &&
                                             campaign.status !== "PAUSED"
                                          }
                                       >
                                          {campaign.status === "ACTIVE"
                                             ? "Pause"
                                             : "Activate"}
                                       </button>
                                       <button
                                          type="button"
                                          className={styles.dangerButton}
                                          onClick={() =>
                                             void removeCampaign(campaign)
                                          }
                                       >
                                          Remove
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                           {campaigns.length === 0 && (
                              <tr>
                                 <td colSpan={8}>No campaigns yet.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </section>

               <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                     <h2>Accounts</h2>
                     <span>Latest {users.length}</span>
                  </div>
                  <div className={styles.tableScroll}>
                     <table>
                        <thead>
                           <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Access</th>
                              <th>Verification</th>
                              <th>Campaigns</th>
                              <th>Credits</th>
                              <th>Joined</th>
                              <th>Actions</th>
                           </tr>
                        </thead>
                        <tbody>
                           {users.map((user) => (
                              <tr key={user.id}>
                                 <td>{user.name}</td>
                                 <td>{user.email}</td>
                                 <td>{user.role}</td>
                                 <td>
                                    {user.emailVerified
                                       ? "Verified"
                                       : "Pending"}
                                 </td>
                                 <td>{user._count.campaigns}</td>
                                 <td>{user.creditsBalance.toLocaleString()}</td>
                                 <td>
                                    {new Date(
                                       user.createdAt,
                                    ).toLocaleDateString()}
                                 </td>
                                 <td>
                                    <button
                                       type="button"
                                       className={styles.actionButton}
                                       onClick={() => void grantCredits(user)}
                                    >
                                       Grant credits
                                    </button>
                                 </td>
                              </tr>
                           ))}
                           {users.length === 0 && (
                              <tr>
                                 <td colSpan={8}>No accounts found.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </section>

               <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                     <h2>Campaign pricing</h2>
                  </div>
                  <div className={styles.pricingForm}>
                     <label htmlFor="credit-rate">
                        Credits per 1,000 target views
                     </label>
                     <input
                        id="credit-rate"
                        type="number"
                        min="1"
                        max="1000000"
                        step="1"
                        value={creditRate}
                        onChange={(event) => setCreditRate(event.target.value)}
                        disabled={pricingLoading}
                     />
                     <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => void savePricing()}
                        disabled={pricingSaving || pricingLoading}
                     >
                        {pricingSaving ? "Saving…" : "Save rate"}
                     </button>
                  </div>
                  {pricingError && (
                     <p className={styles.error} role="alert">
                        {pricingError}
                     </p>
                  )}
               </section>

               <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                     <h2>Google Ads</h2>
                     <button
                        type="button"
                        className={styles.refreshButton}
                        onClick={() => void loadGoogleAds()}
                        disabled={googleAdsLoading}
                     >
                        Refresh
                     </button>
                  </div>
                  {googleAdsError && (
                     <p className={styles.error} role="alert">
                        {googleAdsError}
                     </p>
                  )}
                  {googleAdsLoading ? (
                     <p className={styles.loading}>Loading Google Ads…</p>
                  ) : !googleAdsConfigured ? (
                     <p className={styles.loading}>
                        Configure these server variables to connect:{" "}
                        {googleAdsMissing.join(", ")}
                     </p>
                  ) : googleAdsCampaigns.length === 0 ? (
                     <p className={styles.loading}>
                        No Google Ads campaigns found.
                     </p>
                  ) : (
                     <div className={styles.tableScroll}>
                        <table>
                           <thead>
                              <tr>
                                 <th>Campaign</th>
                                 <th>Channel</th>
                                 <th>Status</th>
                                 <th>Control</th>
                              </tr>
                           </thead>
                           <tbody>
                              {googleAdsCampaigns.map((campaign) => (
                                 <tr key={campaign.id}>
                                    <td>{campaign.name}</td>
                                    <td>{campaign.channel}</td>
                                    <td>{campaign.status}</td>
                                    <td>
                                       <button
                                          type="button"
                                          className={styles.actionButton}
                                          onClick={() =>
                                             void setGoogleAdsStatus(campaign)
                                          }
                                          disabled={
                                             campaign.status !== "ENABLED" &&
                                             campaign.status !== "PAUSED"
                                          }
                                       >
                                          {campaign.status === "ENABLED"
                                             ? "Pause"
                                             : "Enable"}
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}
               </section>
            </>
         )}

         <CampaignDetailModal
            campaignId={selectedCampaignId}
            onClose={() => setSelectedCampaignId(null)}
            onEdit={(campaign) => {
               setEditingCampaign(campaign);
               setSelectedCampaignId(null);
            }}
            onDeleted={() => {
               setSelectedCampaignId(null);
               void loadOverview();
            }}
         />
         <CreateCampaignModal
            open={createOpen || !!editingCampaign}
            onClose={closeEditor}
            campaign={editingCampaign}
            onCreated={() => void loadOverview()}
            onUpdated={() => void loadOverview()}
         />
      </main>
   );
}
