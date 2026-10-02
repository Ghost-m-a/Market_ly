"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHead } from "@/components/ui/Page";
import styles from "./affiliates.module.css";

type AffiliateLink = {
   id: string;
   code: string;
   destination: string;
   label: string;
   clicks: number;
   createdAt: string;
};

export default function Page() {
   const [links, setLinks] = useState<AffiliateLink[]>([]);
   const [label, setLabel] = useState("");
   const [destination, setDestination] = useState("");
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState("");
   const [copiedId, setCopiedId] = useState("");

   const loadLinks = async () => {
      setError("");
      try {
         const response = await fetch("/api/affiliates", { cache: "no-store" });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not load links.");
         setLinks(data.links ?? []);
      } catch (err) {
         setError(err instanceof Error ? err.message : "Could not load links.");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      void loadLinks();
   }, []);

   const createLink = async (event: FormEvent) => {
      event.preventDefault();
      setSaving(true);
      setError("");
      try {
         const response = await fetch("/api/affiliates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label, destination }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not create link.");
         setLinks((current) => [data.link, ...current]);
         setLabel("");
         setDestination("");
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not create link.",
         );
      } finally {
         setSaving(false);
      }
   };

   const copyLink = async (link: AffiliateLink) => {
      try {
         await navigator.clipboard.writeText(
            `${window.location.origin}/go/${link.code}`,
         );
         setCopiedId(link.id);
         window.setTimeout(() => setCopiedId(""), 1600);
      } catch {
         setError("Could not copy link. Check clipboard permissions.");
      }
   };

   const removeLink = async (id: string) => {
      setError("");
      try {
         const response = await fetch("/api/affiliates", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not remove link.");
         setLinks((current) => current.filter((link) => link.id !== id));
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not remove link.",
         );
      }
   };

   return (
      <main className={styles.page}>
         <PageHead
            title="Affiliates"
            subtitle="Create trackable referral links."
         />
         <form className={styles.form} onSubmit={createLink}>
            <label>
               Link name
               <input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  maxLength={80}
                  placeholder="Partner campaign"
                  required
               />
            </label>
            <label>
               Destination URL
               <input
                  type="url"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="https://example.com/offer"
                  required
               />
            </label>
            <button
               type="submit"
               disabled={saving || !label.trim() || !destination.trim()}
            >
               {saving ? "Creating…" : "Create link"}
            </button>
         </form>

         {error && (
            <p className={styles.error} role="alert">
               {error}
            </p>
         )}
         <section className={styles.section}>
            <header className={styles.sectionHeader}>
               <h2>Your links</h2>
               <span>{links.length}</span>
            </header>
            {loading ? (
               <p className={styles.empty}>Loading links…</p>
            ) : links.length === 0 ? (
               <p className={styles.empty}>No affiliate links created yet.</p>
            ) : (
               <div className={styles.tableScroll}>
                  <table>
                     <thead>
                        <tr>
                           <th>Name</th>
                           <th>Destination</th>
                           <th>Clicks</th>
                           <th>Created</th>
                           <th>Actions</th>
                        </tr>
                     </thead>
                     <tbody>
                        {links.map((link) => (
                           <tr key={link.id}>
                              <td>{link.label}</td>
                              <td>
                                 <a
                                    href={link.destination}
                                    target="_blank"
                                    rel="noreferrer"
                                 >
                                    {link.destination}
                                 </a>
                              </td>
                              <td>{link.clicks.toLocaleString()}</td>
                              <td>
                                 {new Date(link.createdAt).toLocaleDateString()}
                              </td>
                              <td>
                                 <div className={styles.actions}>
                                    <button
                                       type="button"
                                       onClick={() => void copyLink(link)}
                                    >
                                       {copiedId === link.id
                                          ? "Copied"
                                          : "Copy link"}
                                    </button>
                                    <button
                                       type="button"
                                       onClick={() => void removeLink(link.id)}
                                    >
                                       Remove
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </section>
      </main>
   );
}
