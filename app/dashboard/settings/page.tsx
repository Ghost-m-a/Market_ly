"use client";

import { useState } from "react";
import { PageHead, Panel, PrimaryBtn } from "@/components/ui/Page";
import { Field, TextArea } from "@/components/ui/Field";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
   const { user } = useAuth();
   const [businessName, setBusinessName] = useState("Spark & Learn");
   const [description, setDescription] = useState("");
   const [saved, setSaved] = useState(false);

   const save = (e: React.FormEvent) => {
      e.preventDefault();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
   };

   return (
      <div style={{ maxWidth: 720 }}>
         <PageHead
            title="Settings"
            subtitle="Manage your workspace preferences."
         />

         <Panel title="Business">
            <form onSubmit={save}>
               <Field
                  label="Business name"
                  value={businessName}
                  onChange={setBusinessName}
               />
               <TextArea
                  label="Business description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Optional"
                  rows={3}
               />

               <div
                  style={{
                     display: "flex",
                     justifyContent: "flex-end",
                     gap: "0.5rem",
                     marginTop: "0.5rem",
                  }}
               >
                  <PrimaryBtn type="submit">
                     {saved ? "Saved ✓" : "Save changes"}
                  </PrimaryBtn>
               </div>
            </form>
         </Panel>

         <Panel title="Account">
            <div
               style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
               }}
            >
               <p style={{ margin: "0 0 0.4rem" }}>
                  <strong style={{ color: "var(--color-text)" }}>Name:</strong>{" "}
                  {user?.name}
               </p>
               <p style={{ margin: 0 }}>
                  <strong style={{ color: "var(--color-text)" }}>Email:</strong>{" "}
                  {user?.email}
               </p>
            </div>
         </Panel>

         <Panel title="Danger zone">
            <div style={{ padding: "0.75rem 0" }}>
               <div
                  style={{
                     display: "flex",
                     justifyContent: "space-between",
                     alignItems: "center",
                     gap: "1rem",
                     flexWrap: "wrap",
                  }}
               >
                  <div>
                     <p
                        style={{
                           margin: "0 0 0.2rem",
                           fontWeight: 600,
                           color: "var(--color-text)",
                        }}
                     >
                        Delete business
                     </p>
                     <p
                        style={{
                           margin: 0,
                           fontSize: "0.82rem",
                           color: "var(--color-text-secondary)",
                        }}
                     >
                        This will permanently delete all payments, products and
                        customers.
                     </p>
                  </div>
                  <button
                     style={{
                        padding: "0.4rem 0.85rem",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: 8,
                        background: "rgba(239, 68, 68, 0.06)",
                        color: "#ef4444",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                     }}
                  >
                     Delete business
                  </button>
               </div>
            </div>
         </Panel>
      </div>
   );
}
