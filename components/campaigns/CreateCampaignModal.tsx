"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Field, TextArea } from "@/components/ui/Field";
import { PrimaryBtn, GhostBtn } from "@/components/ui/Page";
import {
   PLATFORM_LABELS,
   type CampaignDetail,
   type CampaignSummary,
   type Platform,
} from "@/lib/campaigns";
import styles from "./CreateCampaignModal.module.css";

const ALL_PLATFORMS: Platform[] = [
   "tiktok",
   "x",
   "instagram",
   "youtube",
   "facebook",
];

export default function CreateCampaignModal({
   open,
   onClose,
   onCreated,
   campaign = null,
   onUpdated,
}: {
   open: boolean;
   onClose: () => void;
   onCreated: (c: CampaignSummary) => void;
   campaign?: CampaignDetail | null;
   onUpdated?: (c: CampaignSummary) => void;
}) {
   const [title, setTitle] = useState("");
   const [brandName, setBrandName] = useState("");
   const [brandLogo, setBrandLogo] = useState("");
   const [coverImage, setCoverImage] = useState("");
   const [description, setDescription] = useState("");
   const [budgetDollars, setBudgetDollars] = useState("");
   const [targetViews, setTargetViews] = useState("");
   const [creditsPerThousandViews, setCreditsPerThousandViews] = useState(0);
   const [creditBalance, setCreditBalance] = useState(0);
   const [minimumContribution, setMinimumContribution] = useState("");
   const [minPayout, setMinPayout] = useState("");
   const [maxPayout, setMaxPayout] = useState("");
   const [requirements, setRequirements] = useState("");
   const [referenceUrl, setReferenceUrl] = useState("");
   const [status, setStatus] = useState<CampaignDetail["status"]>("ACTIVE");

   const [platforms, setPlatforms] = useState<Platform[]>(["tiktok"]);
   const [rates, setRates] = useState<Record<Platform, string>>({
      tiktok: "1",
      x: "",
      instagram: "",
      youtube: "",
      facebook: "",
   });

   const [error, setError] = useState("");
   const [saving, setSaving] = useState(false);
   const targetViewCountForQuote = Number(targetViews);
   const estimatedCreditCost =
      Number.isSafeInteger(targetViewCountForQuote) &&
      targetViewCountForQuote > 0 &&
      creditsPerThousandViews > 0
         ? Math.ceil((targetViewCountForQuote * creditsPerThousandViews) / 1000)
         : 0;

   useEffect(() => {
      if (!open) return;
      setError("");
      if (!campaign) {
         setTitle("");
         setBrandName("");
         setBrandLogo("");
         setCoverImage("");
         setDescription("");
         setBudgetDollars("");
         setTargetViews("");
         setMinimumContribution("");
         setMinPayout("");
         setMaxPayout("");
         setRequirements("");
         setReferenceUrl("");
         setStatus("ACTIVE");
         setPlatforms(["tiktok"]);
         setRates({
            tiktok: "1",
            x: "",
            instagram: "",
            youtube: "",
            facebook: "",
         });
         return;
      }

      setTitle(campaign.title);
      setBrandName(campaign.brandName);
      setBrandLogo(campaign.brandLogo ?? "");
      setCoverImage(campaign.coverImage ?? "");
      setDescription(campaign.description ?? "");
      setBudgetDollars((campaign.budgetCents / 100).toFixed(2));
      setTargetViews(String(campaign.targetViews));
      setMinimumContribution(Number(campaign.minimumContribution).toFixed(2));
      setMinPayout((campaign.minPayoutCents / 100).toFixed(2));
      setMaxPayout((campaign.maxPayoutCents / 100).toFixed(2));
      setRequirements(campaign.requirements ?? "");
      setReferenceUrl(campaign.referenceUrl ?? "");
      setStatus(campaign.status);
      setPlatforms(campaign.platforms);
      setRates({
         tiktok: (campaign.rates.tiktok / 100).toFixed(2),
         x: (campaign.rates.x / 100).toFixed(2),
         instagram: (campaign.rates.instagram / 100).toFixed(2),
         youtube: (campaign.rates.youtube / 100).toFixed(2),
         facebook: (campaign.rates.facebook / 100).toFixed(2),
      });
   }, [open, campaign]);

   useEffect(() => {
      if (!open) return;
      let active = true;
      Promise.all([
         fetch("/api/credit-pricing", { cache: "no-store" }).then((response) =>
            response.json(),
         ),
         fetch("/api/me/credits", { cache: "no-store" }).then((response) =>
            response.json(),
         ),
      ])
         .then(([pricing, credits]) => {
            if (!active) return;
            setCreditsPerThousandViews(pricing.creditsPerThousandViews ?? 0);
            setCreditBalance(credits.balance ?? 0);
         })
         .catch(() => {
            if (active) setError("Could not load credit pricing or balance.");
         });
      return () => {
         active = false;
      };
   }, [open]);

   const togglePlatform = (p: Platform) => {
      setPlatforms((cur) =>
         cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p],
      );
   };

   const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!title.trim() || !brandName.trim())
         return setError("Title and brand name are required.");
      if (platforms.length === 0)
         return setError("Choose at least one platform.");
      const budgetCents = Math.round(parseFloat(budgetDollars || "0") * 100);
      if (budgetCents <= 0)
         return setError("Budget must be greater than zero.");
      const targetViewCount = Number(targetViews);
      if (
         !campaign &&
         (!Number.isSafeInteger(targetViewCount) || targetViewCount < 1)
      ) {
         return setError("Enter a target view count greater than zero.");
      }

      const ratePayload = {
         tiktok: Math.round(parseFloat(rates.tiktok || "0") * 100),
         x: Math.round(parseFloat(rates.x || "0") * 100),
         instagram: Math.round(parseFloat(rates.instagram || "0") * 100),
         youtube: Math.round(parseFloat(rates.youtube || "0") * 100),
         facebook: Math.round(parseFloat(rates.facebook || "0") * 100),
      };

      setSaving(true);
      try {
         const res = await fetch(
            campaign ? `/api/campaigns/${campaign.id}` : "/api/campaigns",
            {
               method: campaign ? "PATCH" : "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  title: title.trim(),
                  brandName: brandName.trim(),
                  brandLogo: brandLogo.trim() || null,
                  coverImage: coverImage.trim() || null,
                  description: description.trim() || null,
                  budgetCents,
                  targetViews: targetViewCount,
                  minimumContribution: Number(minimumContribution || "0"),
                  rates: ratePayload,
                  platforms,
                  minPayoutCents: Math.round(
                     parseFloat(minPayout || "0") * 100,
                  ),
                  maxPayoutCents: Math.round(
                     parseFloat(maxPayout || "0") * 100,
                  ),
                  requirements: requirements.trim() || null,
                  referenceUrl: referenceUrl.trim() || null,
                  status,
               }),
            },
         );

         const data = await res.json();
         if (!res.ok)
            throw new Error(data.message ?? "Could not save campaign.");

         if (campaign) onUpdated?.(data.campaign);
         else onCreated(data.campaign);

         onClose();
      } catch (err) {
         setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
         setSaving(false);
      }
   };

   return (
      <Modal
         open={open}
         onClose={onClose}
         title={campaign ? "Edit campaign" : "Create campaign"}
         footer={
            <>
               <GhostBtn onClick={onClose}>Cancel</GhostBtn>
               <PrimaryBtn
                  onClick={() => {
                     const form = document.getElementById(
                        "create-campaign-form",
                     ) as HTMLFormElement;
                     form?.requestSubmit();
                  }}
               >
                  {saving
                     ? "Saving…"
                     : campaign
                       ? "Save changes"
                       : "Create campaign"}
               </PrimaryBtn>
            </>
         }
      >
         <form id="create-campaign-form" onSubmit={submit}>
            <Field
               label="Campaign title"
               value={title}
               onChange={setTitle}
               placeholder="e.g. Clip our podcast"
               required
            />
            <Field
               label="Brand name"
               value={brandName}
               onChange={setBrandName}
               placeholder="Your company"
               required
            />
            <Field
               label="Brand logo URL"
               value={brandLogo}
               onChange={setBrandLogo}
               placeholder="https://…"
            />
            <Field
               label="Cover image URL"
               value={coverImage}
               onChange={setCoverImage}
               placeholder="https://…"
            />

            <TextArea
               label="Description"
               value={description}
               onChange={setDescription}
               placeholder="What this campaign is about…"
               rows={3}
            />

            <section className={styles.creditQuote}>
               <label htmlFor="campaign-target-views">Target views</label>
               <input
                  id="campaign-target-views"
                  type="number"
                  min="1"
                  max="1000000000"
                  step="1"
                  value={targetViews}
                  onChange={(event) => setTargetViews(event.target.value)}
                  disabled={!!campaign}
                  required={!campaign}
               />
               <p>
                  {campaign
                     ? `Campaign charge: ${campaign.campaignCostCredits.toLocaleString()} credits`
                     : `Estimated launch charge: ${estimatedCreditCost.toLocaleString()} credits`}
               </p>
               {!campaign && (
                  <p>
                     Available balance: {creditBalance.toLocaleString()} credits
                  </p>
               )}
               {creditsPerThousandViews <= 0 && (
                  <p>Campaign pricing has not been configured by an admin.</p>
               )}
               {estimatedCreditCost > creditBalance && (
                  <p className={styles.creditWarning}>
                     Your current credit balance is too low to launch this
                     campaign.
                  </p>
               )}
            </section>

            <div className={styles.row}>
               <Field
                  label="Budget (USD)"
                  value={budgetDollars}
                  onChange={setBudgetDollars}
                  type="number"
                  placeholder="1000"
                  required
               />
               <Field
                  label="Min payout (USD)"
                  value={minPayout}
                  onChange={setMinPayout}
                  type="number"
                  placeholder="10"
               />
               <Field
                  label="Max payout (USD)"
                  value={maxPayout}
                  onChange={setMaxPayout}
                  type="number"
                  placeholder="100"
               />
            </div>

            <Field
               label="Minimum contribution (USD)"
               value={minimumContribution}
               onChange={setMinimumContribution}
               type="number"
               placeholder="1.00"
            />

            {campaign && (
               <label className={styles.statusField}>
                  <span>Campaign status</span>
                  <select
                     value={status}
                     onChange={(event) =>
                        setStatus(
                           event.target.value as CampaignDetail["status"],
                        )
                     }
                  >
                     <option value="DRAFT">Draft</option>
                     <option value="ACTIVE">Active</option>
                     <option value="PAUSED">Paused</option>
                     <option value="COMPLETED">Completed</option>
                  </select>
               </label>
            )}

            <div className={styles.platforms}>
               <span className={styles.platformsLabel}>Platforms</span>
               <div className={styles.chips}>
                  {ALL_PLATFORMS.map((p) => (
                     <button
                        key={p}
                        type="button"
                        className={`${styles.chip} ${platforms.includes(p) ? styles.chipActive : ""}`}
                        onClick={() => togglePlatform(p)}
                     >
                        {PLATFORM_LABELS[p]}
                     </button>
                  ))}
               </div>
            </div>

            {platforms.length > 0 && (
               <div className={styles.rates}>
                  <span className={styles.platformsLabel}>
                     Rate per 1k views (USD)
                  </span>
                  <div className={styles.ratesGrid}>
                     {platforms.map((p) => (
                        <Field
                           key={p}
                           label={PLATFORM_LABELS[p]}
                           value={rates[p]}
                           onChange={(v) => setRates((r) => ({ ...r, [p]: v }))}
                           type="number"
                           placeholder="1.00"
                        />
                     ))}
                  </div>
               </div>
            )}

            <TextArea
               label="Content requirements"
               value={requirements}
               onChange={setRequirements}
               placeholder="e.g. Include demographic information, tag the brand…"
               rows={3}
            />
            <Field
               label="Reference URL"
               value={referenceUrl}
               onChange={setReferenceUrl}
               placeholder="https://…"
            />

            {error && (
               <p
                  style={{
                     margin: "0 0 8px",
                     color: "#dc2626",
                     fontSize: "0.85rem",
                  }}
               >
                  {error}
               </p>
            )}
         </form>
      </Modal>
   );
}
