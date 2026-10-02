"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./styles/Sidebar.module.css";

const Svg = ({
   children,
   size = 18,
}: {
   children: React.ReactNode;
   size?: number;
}) => (
   <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
   >
      {children}
   </svg>
);

/* ---------- Icons ---------- */
const IconUser = () => (
   <Svg>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
   </Svg>
);
const IconBriefcase = () => (
   <Svg>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
   </Svg>
);
const IconHome = () => (
   <Svg>
      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M9 22V12h6v10" />
   </Svg>
);
const IconMessage = () => (
   <Svg>
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
   </Svg>
);
const IconBuilding = () => (
   <Svg>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
   </Svg>
);
const IconHandshake = () => (
   <Svg>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8" />
   </Svg>
);
const IconShare = () => (
   <Svg>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
   </Svg>
);
const IconCompass = () => (
   <Svg>
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z" />
   </Svg>
);
const IconChart = () => (
   <Svg>
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 4 4 6-6" />
   </Svg>
);
const IconBox = () => (
   <Svg>
      <path d="m21 8-9-5-9 5v8l9 5 9-5Z" />
      <path d="m3 8 9 5 9-5M12 21V13" />
   </Svg>
);
const IconCard = () => (
   <Svg>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
   </Svg>
);
const IconUsers = () => (
   <Svg>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
   </Svg>
);
const IconGlobe = () => (
   <Svg>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10Z" />
   </Svg>
);
const IconMegaphone = () => (
   <Svg>
      <path d="m3 11 18-5v12L3 14v-3Z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
   </Svg>
);
const IconNetwork = () => (
   <Svg>
      <circle cx="12" cy="12" r="3" />
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="m8 8 2 2M16 8l-2 2M8 16l2-2M16 16l-2-2" />
   </Svg>
);
const IconWallet = () => (
   <Svg>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20M16 14h.01" />
   </Svg>
);
const IconHelp = () => (
   <Svg>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
   </Svg>
);
const IconPlus = () => (
   <Svg>
      <path d="M12 5v14M5 12h14" />
   </Svg>
);
const IconSettings = () => (
   <Svg>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
   </Svg>
);
const IconChevronDown = () => (
   <Svg size={14}>
      <path d="m6 9 6 6 6-6" />
   </Svg>
);
const IconChevronUp = () => (
   <Svg size={14}>
      <path d="m18 15-6-6-6 6" />
   </Svg>
);
const IconArrowRight = () => (
   <Svg size={14}>
      <path d="M5 12h14M12 5l7 7-7 7" />
   </Svg>
);
const IconPanel = () => (
   <Svg size={16}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
   </Svg>
);
const IconPanelFlip = () => (
   <Svg size={16}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M15 3v18" />
   </Svg>
);

/* ---------- Types ---------- */
type Item = {
   label: string;
   href: string;
   icon: React.ReactNode;
   badge?: "New" | "Beta";
};

type Workspace = {
   id: string;
   name: string;
   type: "PERSONAL" | "BUSINESS";
};

/* ---------- Config ---------- */
const PERSONAL_ITEMS: Item[] = [
   { label: "Home", href: "/dashboard", icon: <IconHome /> },
   { label: "Messages", href: "/dashboard/messages", icon: <IconMessage /> },
   { label: "Townhall", href: "/dashboard/townhall", icon: <IconBuilding /> },
   { label: "Partners", href: "/dashboard/partners", icon: <IconHandshake /> },
   { label: "Affiliates", href: "/dashboard/affiliates", icon: <IconShare /> },
   { label: "Discover", href: "/dashboard/discover", icon: <IconCompass /> },
];

const SPARK_LEARN: Item[] = [
   { label: "Home", href: "/dashboard", icon: <IconHome /> },
   { label: "Analytics", href: "/dashboard/analytics", icon: <IconChart /> },
   { label: "Products", href: "/dashboard/products", icon: <IconBox /> },
   { label: "Payments", href: "/dashboard/payments", icon: <IconCard /> },
   { label: "Customers", href: "/dashboard/customers", icon: <IconUsers /> },
   {
      label: "Websites",
      href: "/dashboard/websites",
      icon: <IconGlobe />,
      badge: "New",
   },
];

const GROW: Item[] = [
   { label: "Ads", href: "/dashboard/ads", icon: <IconMegaphone /> },
   {
      label: "Workforce",
      href: "/dashboard/workforce",
      icon: <IconNetwork />,
      badge: "Beta",
   },
   { label: "Affiliates", href: "/dashboard/affiliates", icon: <IconShare /> },
];

const OPERATIONS: Item[] = [
   { label: "Cards", href: "/dashboard/cards", icon: <IconWallet /> },
   { label: "Support", href: "/dashboard/support", icon: <IconHelp /> },
];

const MORE_ITEMS: Item[] = [
   { label: "Reports", href: "/dashboard/reports", icon: null as any },
   {
      label: "Checkout links",
      href: "/dashboard/checkout-links",
      icon: null as any,
   },
   { label: "Invoices", href: "/dashboard/invoices", icon: null as any },
   { label: "Promo codes", href: "/dashboard/promo-codes", icon: null as any },
   { label: "Community", href: "/dashboard/community", icon: null as any },
   { label: "Team", href: "/dashboard/team", icon: null as any },
   {
      label: "Sub accounts",
      href: "/dashboard/sub-accounts",
      icon: null as any,
   },
];

/* ---------- Props ---------- */
type Props = {
   collapsed: boolean;
   mobileOpen: boolean;
   onToggleCollapse: () => void;
   onCloseMobile: () => void;
   onAddWorkspace?: () => void;
};

/* ---------- Component ---------- */
export default function Sidebar({
   collapsed,
   mobileOpen,
   onToggleCollapse,
   onCloseMobile,
   onAddWorkspace,
}: Props) {
   const pathname = usePathname();
   const router = useRouter();
   const { user } = useAuth();

   const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
   const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
   const [workspaceName, setWorkspaceName] = useState("");
   const [workspaceError, setWorkspaceError] = useState("");
   const [workspaceBusy, setWorkspaceBusy] = useState(false);
   const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
   const [moreOpen, setMoreOpen] = useState(false);

   useEffect(() => {
      let active = true;
      if (!user?.id) {
         setWorkspaces([]);
         setActiveWorkspaceId("");
         return;
      }

      fetch("/api/workspaces", { cache: "no-store" })
         .then(async (response) => {
            const data = await response.json();
            if (!response.ok)
               throw new Error(data.message ?? "Could not load workspaces.");
            if (active) {
               setWorkspaces(data.workspaces ?? []);
               setActiveWorkspaceId(data.activeWorkspaceId ?? "");
               setWorkspaceError("");
            }
         })
         .catch((error: unknown) => {
            if (active) {
               setWorkspaceError(
                  error instanceof Error
                     ? error.message
                     : "Could not load workspaces.",
               );
            }
         });

      return () => {
         active = false;
      };
   }, [user?.id]);

   const personalWorkspace = workspaces.find(
      (workspace) => workspace.type === "PERSONAL",
   );
   const activeBusiness = workspaces.find(
      (workspace) =>
         workspace.id === activeWorkspaceId && workspace.type === "BUSINESS",
   );
   const activeWorkspace = workspaces.find(
      (workspace) => workspace.id === activeWorkspaceId,
   );

   const selectWorkspace = async (workspaceId: string) => {
      setWorkspaceBusy(true);
      setWorkspaceError("");
      try {
         const response = await fetch("/api/workspaces", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not switch workspace.");
         setActiveWorkspaceId(data.activeWorkspaceId);
         setWorkspaceMenuOpen(false);
         router.push("/dashboard");
      } catch (error) {
         setWorkspaceError(
            error instanceof Error
               ? error.message
               : "Could not switch workspace.",
         );
      } finally {
         setWorkspaceBusy(false);
      }
   };

   const createWorkspace = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setWorkspaceBusy(true);
      setWorkspaceError("");
      try {
         const response = await fetch("/api/workspaces", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: workspaceName }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not create workspace.");
         setWorkspaces((current) => [...current, data.workspace]);
         setActiveWorkspaceId(data.activeWorkspaceId);
         setWorkspaceName("");
         setWorkspaceMenuOpen(false);
         router.push("/dashboard");
      } catch (error) {
         setWorkspaceError(
            error instanceof Error
               ? error.message
               : "Could not create workspace.",
         );
      } finally {
         setWorkspaceBusy(false);
      }
   };

   const isActive = (href: string) => {
      if (href === "/dashboard") return pathname === "/dashboard";
      return pathname === href || pathname.startsWith(href + "/");
   };

   const renderItems = (items: Item[]) =>
      items.map((item) => {
         const active = isActive(item.href);
         return (
            <Link
               key={item.href + item.label}
               href={item.href}
               className={`${styles.item} ${active ? styles.itemActive : ""}`}
               onClick={onCloseMobile}
               title={collapsed ? item.label : undefined}
            >
               <span className={styles.itemIcon}>{item.icon}</span>
               {!collapsed && (
                  <>
                     <span className={styles.itemLabel}>{item.label}</span>
                     {item.badge && (
                        <span
                           className={`${styles.badge} ${
                              item.badge === "Beta"
                                 ? styles.badgeBeta
                                 : styles.badgeNew
                           }`}
                        >
                           {item.badge}
                        </span>
                     )}
                  </>
               )}
               {collapsed && (
                  <span className={styles.tooltip}>{item.label}</span>
               )}
            </Link>
         );
      });

   return (
      <>
         {mobileOpen && (
            <div className={styles.backdrop} onClick={onCloseMobile} />
         )}

         <aside
            className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${
               mobileOpen ? styles.mobileOpen : ""
            }`}
         >
            {/* ============ Workspace switcher ============ */}
            <div className={styles.workspaceRow}>
               {personalWorkspace && (
                  <button
                     type="button"
                     className={`${styles.workspaceBtn} ${
                        activeWorkspaceId === personalWorkspace.id
                           ? styles.workspaceBtnActive
                           : ""
                     }`}
                     onClick={() => void selectWorkspace(personalWorkspace.id)}
                     aria-label="Personal workspace"
                     title={personalWorkspace.name}
                     disabled={workspaceBusy}
                  >
                     <IconUser />
                  </button>
               )}

               {activeBusiness && (
                  <button
                     type="button"
                     className={`${styles.workspacePill} ${styles.workspacePillActive}`}
                     onClick={() => setWorkspaceMenuOpen((open) => !open)}
                     aria-label={`${activeBusiness.name} workspace menu`}
                     aria-expanded={workspaceMenuOpen}
                     title={activeBusiness.name}
                  >
                     {activeBusiness.name
                        .split(/\s+/)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                  </button>
               )}

               {!activeBusiness && (
                  <button
                     type="button"
                     className={styles.workspacePill}
                     onClick={() => setWorkspaceMenuOpen((open) => !open)}
                     aria-label="Choose a business workspace"
                     aria-expanded={workspaceMenuOpen}
                  >
                     <IconBriefcase />
                  </button>
               )}

               {!collapsed && user && (
                  <button
                     type="button"
                     className={styles.addBtn}
                     onClick={() => setWorkspaceMenuOpen((open) => !open)}
                     aria-label="Add workspace"
                     title="Manage workspaces"
                  >
                     <IconPlus />
                  </button>
               )}

               {workspaceMenuOpen && (
                  <div className={styles.workspaceMenu}>
                     <strong>Workspaces</strong>
                     {workspaces
                        .filter((workspace) => workspace.type === "BUSINESS")
                        .map((workspace) => (
                           <button
                              key={workspace.id}
                              type="button"
                              className={styles.workspaceMenuItem}
                              onClick={() => void selectWorkspace(workspace.id)}
                              disabled={workspaceBusy}
                           >
                              {workspace.name}
                           </button>
                        ))}
                     <form onSubmit={createWorkspace}>
                        <input
                           aria-label="New workspace name"
                           placeholder="Business name"
                           value={workspaceName}
                           onChange={(event) =>
                              setWorkspaceName(event.target.value)
                           }
                           maxLength={60}
                           minLength={2}
                           required
                        />
                        <button type="submit" disabled={workspaceBusy}>
                           {workspaceBusy ? "Saving…" : "Create workspace"}
                        </button>
                     </form>
                  </div>
               )}
            </div>
            {workspaceError && (
               <p className={styles.workspaceError} role="alert">
                  {workspaceError}
               </p>
            )}

            {/* ============ Navigation ============ */}
            <nav className={styles.nav}>
               {activeWorkspace?.type !== "BUSINESS" ? (
                  <>
                     {!collapsed && (
                        <div className={styles.groupLabel}>Personal</div>
                     )}
                     <div className={styles.group}>
                        {renderItems(PERSONAL_ITEMS)}
                     </div>
                  </>
               ) : (
                  <>
                     {!collapsed && (
                        <div className={styles.groupLabel}>
                           Spark &amp; Learn
                        </div>
                     )}
                     <div className={styles.group}>
                        {renderItems(SPARK_LEARN)}
                     </div>

                     {!collapsed && (
                        <div className={styles.groupLabel}>Grow</div>
                     )}
                     <div className={styles.group}>{renderItems(GROW)}</div>

                     {!collapsed && (
                        <div className={styles.groupLabel}>Operations</div>
                     )}
                     <div className={styles.group}>
                        {renderItems(OPERATIONS)}
                     </div>

                     {/* More — expandable */}
                     <button
                        type="button"
                        className={styles.moreBtn}
                        onClick={() => setMoreOpen((o) => !o)}
                        aria-expanded={moreOpen}
                     >
                        <span className={styles.moreDots}>···</span>
                        <span className={styles.itemLabel}>More</span>
                        <span className={styles.moreChevron}>
                           {moreOpen ? <IconChevronUp /> : <IconChevronDown />}
                        </span>
                     </button>

                     {moreOpen && !collapsed && (
                        <div className={styles.subGroup}>
                           {MORE_ITEMS.map((item) => (
                              <Link
                                 key={item.href}
                                 href={item.href}
                                 className={`${styles.subItem} ${
                                    isActive(item.href)
                                       ? styles.subItemActive
                                       : ""
                                 }`}
                                 onClick={onCloseMobile}
                              >
                                 <span>{item.label}</span>
                                 {item.label === "Community" && (
                                    <span className={styles.subArrow}>
                                       <IconArrowRight />
                                    </span>
                                 )}
                              </Link>
                           ))}
                        </div>
                     )}

                     {!collapsed && (
                        <div className={styles.groupLabel}>Apps</div>
                     )}
                     <button type="button" className={styles.item}>
                        <span className={styles.itemIcon}>
                           <IconPlus />
                        </span>
                        {!collapsed && (
                           <span className={styles.itemLabel}>Add</span>
                        )}
                        {collapsed && (
                           <span className={styles.tooltip}>Add app</span>
                        )}
                     </button>
                  </>
               )}
            </nav>

            {/* ============ Bottom ============ */}
            <div className={styles.bottom}>
               <Link
                  href="/dashboard/settings"
                  className={`${styles.item} ${
                     isActive("/dashboard/settings") ? styles.itemActive : ""
                  }`}
                  onClick={onCloseMobile}
                  title={collapsed ? "Settings" : undefined}
               >
                  <span className={styles.itemIcon}>
                     <IconSettings />
                  </span>
                  {!collapsed && (
                     <span className={styles.itemLabel}>Settings</span>
                  )}
                  {collapsed && (
                     <span className={styles.tooltip}>Settings</span>
                  )}
               </Link>

               {user?.role === "ADMIN" && (
                  <Link
                     href="/dashboard/admin"
                     className={`${styles.item} ${
                        isActive("/dashboard/admin") ? styles.itemActive : ""
                     }`}
                     onClick={onCloseMobile}
                     title={collapsed ? "Admin" : undefined}
                  >
                     <span className={styles.itemIcon}>
                        <IconSettings />
                     </span>
                     {!collapsed && (
                        <span className={styles.itemLabel}>Admin</span>
                     )}
                     {collapsed && (
                        <span className={styles.tooltip}>Admin</span>
                     )}
                  </Link>
               )}

               <button
                  type="button"
                  className={styles.collapseBtn}
                  onClick={onToggleCollapse}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={collapsed ? "Expand" : "Collapse"}
               >
                  <span className={styles.collapseIcon}>
                     {collapsed ? <IconPanel /> : <IconPanelFlip />}
                  </span>
                  {!collapsed && (
                     <span className={styles.collapseLabel}>Collapse</span>
                  )}
                  {collapsed && <span className={styles.tooltip}>Expand</span>}
               </button>
            </div>
         </aside>
      </>
   );
}
