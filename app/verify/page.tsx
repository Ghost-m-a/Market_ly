"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyPage() {
   const params = useSearchParams();
   const token = params.get("token");
   const [message, setMessage] = useState("Verifying…");

   useEffect(() => {
      if (!token) {
         setMessage("Missing verification token.");
         return;
      }
      fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`)
         .then((r) => r.json())
         .then((d) => setMessage(d.message ?? "Done."))
         .catch(() => setMessage("Something went wrong. Please try again."));
   }, [token]);

   return (
      <main
         style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
         }}
      >
         <div style={{ maxWidth: 480, textAlign: "center" }}>
            <h1 style={{ marginBottom: 12 }}>Email verification</h1>
            <p style={{ color: "#666", lineHeight: 1.6 }}>{message}</p>
         </div>
      </main>
   );
}
