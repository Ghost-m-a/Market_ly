"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PageHead } from "@/components/ui/Page";
import styles from "./partners.module.css";

type Partner = {
   id: string;
   status: "PENDING" | "ACCEPTED" | "DECLINED";
   direction: "SENT" | "RECEIVED";
   createdAt: string;
   partner: {
      id: string;
      name: string;
      email: string;
      image: string | null;
   } | null;
};

export default function Page() {
   const [partners, setPartners] = useState<Partner[]>([]);
   const [email, setEmail] = useState("");
   const [filter, setFilter] = useState<"ALL" | "RECEIVED" | "ACCEPTED">("ALL");
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState("");

   const loadPartners = async () => {
      setError("");
      try {
         const response = await fetch("/api/partners", { cache: "no-store" });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not load partners.");
         setPartners(data.partners ?? []);
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not load partners.",
         );
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      void loadPartners();
   }, []);

   const invite = async (event: FormEvent) => {
      event.preventDefault();
      if (saving) return;
      setSaving(true);
      setError("");
      try {
         const response = await fetch("/api/partners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not invite partner.");
         setPartners((current) => [data.partner, ...current]);
         setEmail("");
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not invite partner.",
         );
      } finally {
         setSaving(false);
      }
   };

   const respond = async (
      partner: Partner,
      status: "ACCEPTED" | "DECLINED",
   ) => {
      setError("");
      try {
         const response = await fetch("/api/partners", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ connectionId: partner.id, status }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not update request.");
         setPartners((current) =>
            current.map((item) =>
               item.id === partner.id ? { ...item, status: data.status } : item,
            ),
         );
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not update request.",
         );
      }
   };

   const visible = partners.filter((partner) => {
      if (filter === "RECEIVED")
         return (
            partner.direction === "RECEIVED" && partner.status === "PENDING"
         );
      if (filter === "ACCEPTED") return partner.status === "ACCEPTED";
      return partner.status !== "DECLINED";
   });

   return (
      <main className={styles.page}>
         <PageHead title="Partners" subtitle="Connect with other members." />
         <form className={styles.inviteForm} onSubmit={invite}>
            <label htmlFor="partner-email">Invite a member</label>
            <div>
               <input
                  id="partner-email"
                  type="email"
                  autoComplete="email"
                  placeholder="member@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
               />
               <button type="submit" disabled={saving || !email.trim()}>
                  {saving ? "Sending…" : "Send request"}
               </button>
            </div>
         </form>

         {error && (
            <p className={styles.error} role="alert">
               {error}
            </p>
         )}
         <nav className={styles.filters} aria-label="Partner filters">
            <button
               type="button"
               className={filter === "ALL" ? styles.activeFilter : ""}
               onClick={() => setFilter("ALL")}
            >
               All (
               {
                  partners.filter((partner) => partner.status !== "DECLINED")
                     .length
               }
               )
            </button>
            <button
               type="button"
               className={filter === "RECEIVED" ? styles.activeFilter : ""}
               onClick={() => setFilter("RECEIVED")}
            >
               Requests (
               {
                  partners.filter(
                     (partner) =>
                        partner.direction === "RECEIVED" &&
                        partner.status === "PENDING",
                  ).length
               }
               )
            </button>
            <button
               type="button"
               className={filter === "ACCEPTED" ? styles.activeFilter : ""}
               onClick={() => setFilter("ACCEPTED")}
            >
               Connected (
               {
                  partners.filter((partner) => partner.status === "ACCEPTED")
                     .length
               }
               )
            </button>
         </nav>

         {loading ? (
            <p className={styles.empty}>Loading partners…</p>
         ) : visible.length === 0 ? (
            <p className={styles.empty}>No partner records to show.</p>
         ) : (
            <div className={styles.list}>
               {visible.map((partner) => (
                  <article className={styles.row} key={partner.id}>
                     <div className={styles.avatar}>
                        {partner.partner?.image ? (
                           <img src={partner.partner.image} alt="" />
                        ) : (
                           (partner.partner?.name.charAt(0).toUpperCase() ??
                           "?")
                        )}
                     </div>
                     <div className={styles.identity}>
                        <strong>
                           {partner.partner?.name ?? "Unavailable account"}
                        </strong>
                        <span>{partner.partner?.email ?? ""}</span>
                     </div>
                     <span className={styles.status}>{partner.status}</span>
                     {partner.direction === "RECEIVED" &&
                        partner.status === "PENDING" && (
                           <div className={styles.actions}>
                              <button
                                 type="button"
                                 onClick={() =>
                                    void respond(partner, "ACCEPTED")
                                 }
                              >
                                 Accept
                              </button>
                              <button
                                 type="button"
                                 onClick={() =>
                                    void respond(partner, "DECLINED")
                                 }
                              >
                                 Decline
                              </button>
                           </div>
                        )}
                  </article>
               ))}
            </div>
         )}
      </main>
   );
}
