"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState, PageHead, StatCard, Table } from "@/components/ui/Page";
import styles from "./payments.module.css";

type TransactionItem = {
   id: string;
   amount: number;
   amountPaid: number;
   currency: string;
   status: string;
   createdAt: string;
   campaign: { id: string; title: string } | null;
};

function money(amount: number, currency: string) {
   return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
   }).format(amount);
}

export default function PaymentsPage() {
   const [transactions, setTransactions] = useState<TransactionItem[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState("");
   const [notice, setNotice] = useState("");

   useEffect(() => {
      let active = true;
      if (
         new URLSearchParams(window.location.search).get("checkout") ===
         "success"
      ) {
         setNotice(
            "Checkout returned successfully. Payment confirmation may take a few seconds.",
         );
      }

      fetch("/api/transactions", { cache: "no-store" })
         .then(async (response) => {
            const data = await response.json();
            if (!response.ok)
               throw new Error(data.message ?? "Could not load transactions.");
            return data as TransactionItem[];
         })
         .then((items) => {
            if (active) setTransactions(items);
         })
         .catch((reason) => {
            if (active)
               setError(
                  reason instanceof Error
                     ? reason.message
                     : "Could not load transactions.",
               );
         })
         .finally(() => {
            if (active) setLoading(false);
         });

      return () => {
         active = false;
      };
   }, []);

   const paidTotal = transactions
      .filter((transaction) => transaction.status === "COMPLETED")
      .reduce((total, transaction) => total + transaction.amountPaid, 0);
   const pendingTotal = transactions
      .filter((transaction) => transaction.status === "PENDING")
      .reduce((total, transaction) => total + transaction.amount, 0);

   return (
      <div>
         <PageHead
            title="Payments"
            subtitle="Your campaign contributions and transaction history."
         />

         {notice && (
            <p className={styles.notice} role="status">
               {notice}
            </p>
         )}
         {error && (
            <p className={styles.error} role="alert">
               {error}
            </p>
         )}

         <div className={styles.stats}>
            <StatCard
               label="Completed contributions"
               value={money(paidTotal, "USD")}
            />
            <StatCard
               label="Pending checkout"
               value={money(pendingTotal, "USD")}
            />
            <StatCard
               label="Transactions"
               value={String(transactions.length)}
            />
         </div>

         <section className={styles.history}>
            <div className={styles.historyHead}>
               <h2>Transaction history</h2>
               <span>{transactions.length}</span>
            </div>

            {loading ? (
               <p className={styles.message}>Loading transactions…</p>
            ) : (
               <Table
                  columns={[
                     {
                        key: "campaign",
                        label: "Campaign",
                        width: "minmax(0, 2fr)",
                     },
                     { key: "date", label: "Date", width: "1fr" },
                     { key: "amount", label: "Amount", width: "1fr" },
                     { key: "status", label: "Status", width: "120px" },
                  ]}
                  rows={transactions}
                  emptyTitle="No transactions yet"
                  emptyText="Your campaign contributions and their payment status will appear here."
                  emptyAction={
                     <Link
                        href="/dashboard/discover"
                        className={styles.discoverLink}
                     >
                        Discover campaigns
                     </Link>
                  }
                  renderRow={(transaction) => (
                     <>
                        <span className={styles.campaignName}>
                           {transaction.campaign?.title ??
                              "Campaign contribution"}
                        </span>
                        <span>
                           {new Date(
                              transaction.createdAt,
                           ).toLocaleDateString()}
                        </span>
                        <span className={styles.amount}>
                           {money(
                              transaction.status === "COMPLETED"
                                 ? transaction.amountPaid
                                 : transaction.amount,
                              transaction.currency,
                           )}
                        </span>
                        <span>
                           <span
                              className={`${styles.status} ${styles[transaction.status.toLowerCase()] ?? ""}`}
                           >
                              {transaction.status.toLowerCase()}
                           </span>
                        </span>
                     </>
                  )}
               />
            )}
         </section>
      </div>
   );
}
