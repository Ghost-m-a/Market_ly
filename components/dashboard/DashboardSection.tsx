import styles from "./styles/dashboard.module.css";

const content: Record<
   string,
   {
      description: string;
      metrics: [string, string, string][];
      rows: [string, string, string][];
   }
> = {
   Analytics: {
      description:
         "Track the numbers behind your business and spot changes as they happen.",
      metrics: [
         ["Gross volume", "$48,392", "+12.8%"],
         ["Orders", "1,284", "+9.3%"],
         ["Conversion", "4.82%", "+0.6%"],
      ],
      rows: [
         ["Revenue", "$48,392.18", "Up 12.8%"],
         ["New customers", "184", "Up 16.2%"],
         ["Refunds", "$612.00", "Down 3.1%"],
      ],
   },
   Products: {
      description:
         "Manage the offers and memberships available to your customers.",
      metrics: [
         ["Active products", "8", "2 memberships"],
         ["Subscribers", "1,284", "+9.3%"],
         ["Product revenue", "$18,240", "+6.4%"],
      ],
      rows: [
         ["Spark Study Hub", "Membership", "Active"],
         ["Creator Toolkit", "One-time", "Active"],
         ["Study Sprint", "Membership", "Draft"],
      ],
   },
   Payments: {
      description: "Review recent transactions, payouts, and payment activity.",
      metrics: [
         ["Available", "$24,680", "Ready to withdraw"],
         ["Pending", "$3,240", "Arrives soon"],
         ["Volume", "$48,392", "Last 30 days"],
      ],
      rows: [
         ["pmt_8f21a", "$129.00", "Succeeded"],
         ["pmt_8f20c", "$42.00", "Succeeded"],
         ["pmt_8f1d9", "$89.00", "Refunded"],
      ],
   },
   Customers: {
      description:
         "Understand your audience and keep customer relationships moving.",
      metrics: [
         ["Total customers", "2,840", "+14.2%"],
         ["New this month", "184", "+16.2%"],
         ["Renewal rate", "92.4%", "+2.1%"],
      ],
      rows: [
         ["Maya Hassan", "maya@example.com", "Active"],
         ["Omar Khalil", "omar@example.com", "Active"],
         ["Nour Ali", "nour@example.com", "At risk"],
      ],
   },
   Websites: {
      description: "Publish and monitor your storefronts from one place.",
      metrics: [
         ["Websites", "3", "2 published"],
         ["Visits", "20.5k", "+18.6%"],
         ["Conversion", "4.82%", "+0.6%"],
      ],
      rows: [
         ["Spark Study Hub", "sparkstudy.co", "Published"],
         ["Learn Lab", "learnlab.io", "Published"],
         ["Creator Academy", "creator.academy", "Draft"],
      ],
   },
   Ads: {
      description:
         "Keep an eye on campaign reach, spend, and customer acquisition.",
      metrics: [
         ["Ad spend", "$2,480", "This month"],
         ["Impressions", "84.2k", "+21.4%"],
         ["ROAS", "3.8×", "+0.4×"],
      ],
      rows: [
         ["Back to school", "$1,240 spent", "Running"],
         ["Creator launch", "$840 spent", "Running"],
         ["Spring offer", "$400 spent", "Paused"],
      ],
   },
   Workforce: {
      description:
         "Coordinate your team and review access across the workspace.",
      metrics: [
         ["Team members", "12", "3 roles"],
         ["Open invites", "2", "Awaiting response"],
         ["Online now", "4", "Across 2 teams"],
      ],
      rows: [
         ["Workspace admin", "4 members", "Managed"],
         ["Support team", "5 members", "Managed"],
         ["Growth team", "3 members", "Managed"],
      ],
   },
   Affiliates: {
      description: "Measure partner referrals and the revenue they bring in.",
      metrics: [
         ["Active affiliates", "28", "+4 this month"],
         ["Referrals", "642", "+11.8%"],
         ["Commissions", "$3,840", "Pending $420"],
      ],
      rows: [
         ["Lina Creates", "184 referrals", "$1,104"],
         ["StudyWithSam", "126 referrals", "$756"],
         ["The Learning Edit", "98 referrals", "$588"],
      ],
   },
   Cards: {
      description: "Monitor team cards, spending limits, and recent purchases.",
      metrics: [
         ["Cards in use", "6", "of 8 issued"],
         ["Spent this month", "$1,840", "Within budget"],
         ["Monthly limit", "$5,000", "37% used"],
      ],
      rows: [
         ["Marketing spend", "$284.00", "Today"],
         ["Workspace tools", "$96.00", "Yesterday"],
         ["Campaign assets", "$412.00", "Sep 26"],
      ],
   },
   Support: {
      description: "Stay on top of customer questions and response times.",
      metrics: [
         ["Open tickets", "14", "4 need attention"],
         ["Avg. response", "38 min", "Down 12 min"],
         ["Satisfaction", "96%", "+2%"],
      ],
      rows: [
         ["Order access question", "Maya H.", "Open"],
         ["Membership update", "Kareem S.", "In progress"],
         ["Billing clarification", "Yasmin A.", "Resolved"],
      ],
   },
   Messages: {
      description: "Recent conversations from your customers and community.",
      metrics: [
         ["Unread", "8", "Across 3 inboxes"],
         ["Replied today", "24", "+6 vs. yesterday"],
         ["Avg. response", "22 min", "On track"],
      ],
      rows: [
         ["Course access", "Maya Hassan", "2 min ago"],
         ["Product question", "Omar Khalil", "18 min ago"],
         ["Billing help", "Nour Ali", "1 hr ago"],
      ],
   },
   Townhall: {
      description: "Share announcements and keep your community in the loop.",
      metrics: [
         ["Members", "2,840", "+14.2%"],
         ["Posts this week", "12", "+3 vs. last week"],
         ["Engagement", "68%", "+5.4%"],
      ],
      rows: [
         ["September community update", "428 views", "Today"],
         ["New course drop", "1,204 views", "Sep 27"],
         ["Ask us anything", "892 views", "Sep 24"],
      ],
   },
   Partners: {
      description:
         "Build relationships with collaborators and platform partners.",
      metrics: [
         ["Partners", "18", "3 pending"],
         ["Referred customers", "326", "+8.1%"],
         ["Partner revenue", "$9,420", "+12.4%"],
      ],
      rows: [
         ["Northstar Learning", "Education", "Active"],
         ["Creator Circle", "Community", "Active"],
         ["Brightpath Media", "Marketing", "Pending"],
      ],
   },
   Discover: {
      description:
         "Explore tools and opportunities to help your business grow.",
      metrics: [
         ["Recommended", "6", "Picked for you"],
         ["Categories", "12", "Explore all"],
         ["Saved items", "4", "In your library"],
      ],
      rows: [
         ["Creator analytics", "Insights", "Recommended"],
         ["Audience builder", "Growth", "Popular"],
         ["Community inbox", "Engagement", "New"],
      ],
   },
   Developer: {
      description: "Build apps and manage API access for your workspace.",
      metrics: [
         ["API keys", "0", "Create your first"],
         ["Apps", "0", "Start building"],
         ["API version", "2026-01", "Current"],
      ],
      rows: [
         ["Company API keys", "No keys created", "Get started"],
         ["Apps", "No apps created", "Get started"],
         ["Documentation", "API reference", "View guide"],
      ],
   },
   Settings: {
      description: "Manage workspace details, preferences, and account access.",
      metrics: [
         ["Workspace", "Spark & Learn", "Business"],
         ["Members", "12", "3 roles"],
         ["Security", "Protected", "2FA enabled"],
      ],
      rows: [
         ["Workspace profile", "Name, logo, domain", "Configured"],
         ["Notifications", "Email and in-app", "Review"],
         ["Security", "Sign-in and access", "Protected"],
      ],
   },
};

export default function DashboardSection({ title }: { title: string }) {
   const section = content[title] ?? content.Analytics;
   const columns =
      title === "Customers"
         ? ["Customer", "Email", "Status"]
         : title === "Payments"
           ? ["Transaction", "Amount", "Status"]
           : ["Name", "Details", "Status"];

   return (
      <div className={styles.wrap}>
         <header className={styles.pageHead}>
            <div>
               <p className={styles.eyebrow}>SPARK &amp; LEARN / WORKSPACE</p>
               <h1 className={styles.pageTitle}>{title}</h1>
               <p className={styles.pageDescription}>{section.description}</p>
            </div>
            <span className={styles.updated}>Updated just now</span>
         </header>
         <section
            className={styles.sectionMetrics}
            aria-label={`${title} summary`}
         >
            {section.metrics.map(([label, value, change]) => (
               <article className={styles.metricCard} key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{change}</small>
               </article>
            ))}
         </section>
         <section className={styles.dataPanel}>
            <header className={styles.dataHeader}>
               <div>
                  <p className={styles.panelKicker}>AT A GLANCE</p>
                  <h2 className={styles.panelTitle}>
                     Recent {title.toLowerCase()}
                  </h2>
               </div>
               <span className={styles.quarter}>Last 30 days</span>
            </header>
            <div className={styles.dataTable}>
               <div className={styles.tableHead}>
                  {columns.map((column) => (
                     <span key={column}>{column}</span>
                  ))}
               </div>
               {section.rows.map((row) => (
                  <div className={styles.tableRow} key={row[0]}>
                     {row.map((cell, index) => (
                        <span
                           className={index === 2 ? styles.statusCell : ""}
                           key={cell}
                        >
                           {index === 2 && <i />} {cell}
                        </span>
                     ))}
                  </div>
               ))}
            </div>
         </section>
      </div>
   );
}
