"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
   const token = useSearchParams().get("token");
   const [msg, setMsg] = useState("Verifying…");

   useEffect(() => {
      if (!token) return setMsg("Missing token.");
      fetch(`/api/auth/verify?token=${token}`)
         .then((r) => r.json())
         .then((d) => setMsg(d.message));
   }, [token]);

   return <p style={{ padding: 40 }}>{msg}</p>;
}
