"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Field, TextArea } from "@/components/ui/Field";
import { PrimaryBtn, GhostBtn } from "@/components/ui/Page";
import {
   PLATFORM_LABELS,
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
}: {
   open: boolean;
   onClose: () => void;
   onCreated: (c: CampaignSummary) => void;
}) {
   const [title, setTitle] = useState("");
   const [brandName, setBrandName] = useState("");
   const [coverImage, setCoverImage] = useState("");
   const [description, setDescription] = useState("");
   const [budgetDollars, setBudgetDollars] = useState("");
   const [minPayout, setMinPayout] = useState("");
   const [maxPayout, setMaxPayout] = useState("");
   const [requirements, setRequirements] = useState("");
   const [referenceUrl, setReferenceUrl] = useState("");

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

      const ratePayload = {
         tiktok: Math.round(parseFloat(rates.tiktok || "0") * 100),
         x: Math.round(parseFloat(rates.x || "0") * 100),
         instagram: Math.round(parseFloat(rates.instagram || "0") * 100),
         youtube: Math.round(parseFloat(rates.youtube || "0") * 100),
         facebook: Math.round(parseFloat(rates.facebook || "0") * 100),
      };

      setSaving(true);
      try {
         const res = await fetch("/api/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               title: title.trim(),
               brandName: brandName.trim(),
               coverImage: coverImage.trim() || null,
               description: description.trim() || null,
               budgetCents,
               rates: ratePayload,
               platforms,
               minPayoutCents: Math.round(parseFloat(minPayout || "0") * 100),
               maxPayoutCents: Math.round(parseFloat(maxPayout || "0") * 100),
               requirements: requirements.trim() || null,
               referenceUrl: referenceUrl.trim() || null,
            }),
         });

         const data = await res.json();
         if (!res.ok)
            throw new Error(data.message ?? "Could not create campaign.");

         onCreated(data.campaign);

         // reset
         setTitle("");
         setBrandName("");
         setCoverImage("");
         setDescription("");
         setBudgetDollars("");
         setMinPayout("");
         setMaxPayout("");
         setRequirements("");
         setReferenceUrl("");
         setPlatforms(["tiktok"]);
         setRates({
            tiktok: "1",
            x: "",
            instagram: "",
            youtube: "",
            facebook: "",
         });
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
         title="Create campaign"
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
                  {saving ? "Creating…" : "Create campaign"}
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
