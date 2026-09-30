"use client";

import styles from "./ui.module.css";

export function PageHead({
   title,
   subtitle,
   actions,
}: {
   title: string;
   subtitle?: string;
   actions?: React.ReactNode;
}) {
   return (
      <header className={styles.pageHead}>
         <div>
            <h1 className={styles.pageTitle}>{title}</h1>
            {subtitle && <p className={styles.pageSub}>{subtitle}</p>}
         </div>
         {actions && <div className={styles.pageActions}>{actions}</div>}
      </header>
   );
}

export function PrimaryBtn({
   children,
   onClick,
   type = "button",
   disabled,
}: {
   children: React.ReactNode;
   onClick?: () => void;
   type?: "button" | "submit";
   disabled?: boolean;
}) {
   return (
      <button
         className={styles.primaryBtn}
         onClick={onClick}
         type={type}
         disabled={disabled}
      >
         {children}
      </button>
   );
}

export function GhostBtn({
   children,
   onClick,
   type = "button",
}: {
   children: React.ReactNode;
   onClick?: () => void;
   type?: "button" | "submit";
}) {
   return (
      <button className={styles.ghostBtn} onClick={onClick} type={type}>
         {children}
      </button>
   );
}

export function Panel({
   title,
   actions,
   children,
   padded = true,
}: {
   title?: string;
   actions?: React.ReactNode;
   children: React.ReactNode;
   padded?: boolean;
}) {
   return (
      <section className={styles.panel}>
         {title && (
            <header className={styles.panelHead}>
               <h2 className={styles.panelTitle}>{title}</h2>
               {actions && <div>{actions}</div>}
            </header>
         )}
         <div className={padded ? styles.panelBody : ""}>{children}</div>
      </section>
   );
}

export function EmptyState({
   illustration,
   title,
   text,
   action,
}: {
   illustration?: React.ReactNode;
   title: string;
   text?: string;
   action?: React.ReactNode;
}) {
   return (
      <div className={styles.empty}>
         {illustration && (
            <div className={styles.emptyIllus}>{illustration}</div>
         )}
         <h3 className={styles.emptyTitle}>{title}</h3>
         {text && <p className={styles.emptyText}>{text}</p>}
         {action && <div className={styles.emptyAction}>{action}</div>}
      </div>
   );
}

export function Table<T extends { id: string }>({
   columns,
   rows,
   renderRow,
   emptyTitle,
   emptyText,
   emptyAction,
   emptyIllustration,
}: {
   columns: { key: string; label: string; width?: string }[];
   rows: T[];
   renderRow: (row: T) => React.ReactNode;
   emptyTitle: string;
   emptyText?: string;
   emptyAction?: React.ReactNode;
   emptyIllustration?: React.ReactNode;
}) {
   if (rows.length === 0) {
      return (
         <EmptyState
            illustration={emptyIllustration}
            title={emptyTitle}
            text={emptyText}
            action={emptyAction}
         />
      );
   }

   return (
      <div className={styles.tableWrap}>
         <div
            className={styles.thead}
            style={{
               gridTemplateColumns: columns
                  .map((c) => c.width ?? "1fr")
                  .join(" "),
            }}
         >
            {columns.map((c) => (
               <span key={c.key}>{c.label}</span>
            ))}
         </div>
         <div className={styles.tbody}>
            {rows.map((row) => (
               <div
                  key={row.id}
                  className={styles.trow}
                  style={{
                     gridTemplateColumns: columns
                        .map((c) => c.width ?? "1fr")
                        .join(" "),
                  }}
               >
                  {renderRow(row)}
               </div>
            ))}
         </div>
      </div>
   );
}

export function StatCard({
   label,
   value,
   change,
   trend = "up",
}: {
   label: string;
   value: string;
   change?: string;
   trend?: "up" | "down" | "flat";
}) {
   return (
      <div className={styles.statCard}>
         <p className={styles.statLabel}>{label}</p>
         <p className={styles.statValue}>{value}</p>
         {change && (
            <p
               className={`${styles.statChange} ${
                  trend === "up"
                     ? styles.statUp
                     : trend === "down"
                       ? styles.statDown
                       : ""
               }`}
            >
               {change}
            </p>
         )}
      </div>
   );
}
