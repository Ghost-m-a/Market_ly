"use client";

import { PageHead, StatCard, Panel } from "@/components/ui/Page";

const REVENUE_POINTS = [
   4, 12, 9, 18, 25, 22, 30, 34, 32, 42, 48, 55, 52, 60, 68, 72, 78, 85,
];

function LineChart() {
   const max = Math.max(...REVENUE_POINTS);
   const w = 800;
   const h = 200;
   const step = w / (REVENUE_POINTS.length - 1);
   const points = REVENUE_POINTS.map((v, i) => [i * step, h - (v / max) * h]);

   const line = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`)
      .join(" ");
   const area = `${line} L${w},${h} L0,${h} Z`;

   return (
      <svg
         viewBox={`0 0 ${w} ${h}`}
         preserveAspectRatio="none"
         style={{ width: "100%", height: 220 }}
      >
         <defs>
            <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
               <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
               <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
         </defs>
         <path d={area} fill="url(#revGrad)" />
         <path d={line} fill="none" stroke="#2563eb" strokeWidth="2" />
      </svg>
   );
}

export default function AnalyticsPage() {
   return (
      <div>
         <PageHead
            title="Analytics"
            subtitle="Track performance across products, customers, and revenue."
         />

         <div
            style={{
               display: "grid",
               gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
               gap: "1rem",
               marginBottom: "1.25rem",
            }}
         >
            <StatCard
               label="Total revenue"
               value="$4,280"
               change="+12.4% this month"
            />
            <StatCard label="Visitors" value="8,491" change="+8.1% this week" />
            <StatCard
               label="Conversion rate"
               value="3.2%"
               change="-0.4% this week"
               trend="down"
            />
            <StatCard label="Avg. order value" value="$42.80" change="+$3.10" />
         </div>

         <Panel title="Revenue · last 30 days">
            <LineChart />
         </Panel>

         <Panel title="Top products">
            <div style={{ display: "grid", gap: "0.75rem" }}>
               {[
                  { name: "Spark & Learn Pro", sales: 148, revenue: "$4,292" },
                  { name: "Coaching Session", sales: 32, revenue: "$3,168" },
                  { name: "Starter Pack", sales: 89, revenue: "$2,670" },
               ].map((p) => (
                  <div
                     key={p.name}
                     style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid var(--color-border)",
                     }}
                  >
                     <span
                        style={{ fontWeight: 500, color: "var(--color-text)" }}
                     >
                        {p.name}
                     </span>
                     <span
                        style={{
                           color: "var(--color-text-secondary)",
                           fontSize: "0.85rem",
                        }}
                     >
                        {p.sales} sales · {p.revenue}
                     </span>
                  </div>
               ))}
            </div>
         </Panel>
      </div>
   );
}
