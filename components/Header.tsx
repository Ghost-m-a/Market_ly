"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./AuthModal";
import SearchModal from "./SearchModal";
import styles from "./styles/Header.module.css";

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

const IconLogo = () => (
   <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
         d="M2 6l3 12 4-8 3 8 3-12 3 12 4-12"
         stroke="#f30008"
         strokeWidth="2.4"
         strokeLinecap="round"
         strokeLinejoin="round"
      />
   </svg>
);

const IconSearch = () => (
   <Svg size={15}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
   </Svg>
);
const IconCode = () => (
   <Svg>
      <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
   </Svg>
);
const IconHelp = () => (
   <Svg>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
   </Svg>
);
const IconSparkle = () => (
   <Svg>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
   </Svg>
);
const IconBell = () => (
   <Svg>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
   </Svg>
);
const IconMessage = () => (
   <Svg>
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" />
   </Svg>
);
const IconChevronDown = () => (
   <Svg size={12}>
      <path d="m6 9 6 6 6-6" />
   </Svg>
);

type NotificationItem = {
   id: string;
   title: string;
   message: string;
   read: boolean;
   link: string | null;
   createdAt: string;
};

export default function Header() {
   const { user, loading, logout } = useAuth();
   const router = useRouter();

   const [menuOpen, setMenuOpen] = useState(false);
   const [authOpen, setAuthOpen] = useState(false);
   const [searchOpen, setSearchOpen] = useState(false);
   const [notifOpen, setNotifOpen] = useState(false);
   const [notifications, setNotifications] = useState<NotificationItem[]>([]);

   const userRef = useRef<HTMLDivElement>(null);
   const notifRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      let active = true;
      if (!user?.id) {
         setNotifications([]);
         return;
      }

      fetch(`/api/notifications?userId=${encodeURIComponent(user.id)}`, {
         cache: "no-store",
      })
         .then((response) => (response.ok ? response.json() : []))
         .then((items: NotificationItem[]) => {
            if (active) setNotifications(items);
         })
         .catch(() => {
            if (active) setNotifications([]);
         });

      return () => {
         active = false;
      };
   }, [user?.id, notifOpen]);

   useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
         if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            setSearchOpen(true);
         }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
   }, []);

   useEffect(() => {
      if (!menuOpen) return;
      const onDown = (e: MouseEvent) => {
         if (userRef.current && !userRef.current.contains(e.target as Node))
            setMenuOpen(false);
      };
      document.addEventListener("mousedown", onDown);
      return () => document.removeEventListener("mousedown", onDown);
   }, [menuOpen]);

   useEffect(() => {
      if (!notifOpen) return;
      const onDown = (e: MouseEvent) => {
         if (notifRef.current && !notifRef.current.contains(e.target as Node))
            setNotifOpen(false);
      };
      document.addEventListener("mousedown", onDown);
      return () => document.removeEventListener("mousedown", onDown);
   }, [notifOpen]);

   const handleLogout = async () => {
      setMenuOpen(false);
      await logout();
      router.push("/");
   };

   const openNotification = async (notification: NotificationItem) => {
      if (!notification.read) {
         const response = await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationId: notification.id }),
         });
         if (response.ok) {
            setNotifications((current) =>
               current.map((item) =>
                  item.id === notification.id ? { ...item, read: true } : item,
               ),
            );
         }
      }
      setNotifOpen(false);
      if (notification.link) router.push(notification.link);
   };

   const unreadCount = notifications.filter(
      (notification) => !notification.read,
   ).length;

   return (
      <>
         <header className={styles.header}>
            <Link href="/dashboard" className={styles.logo}>
               <IconLogo />
               <span className={styles.logoText}>Market_ly</span>
            </Link>

            <button
               className={styles.searchTrigger}
               onClick={() => setSearchOpen(true)}
            >
               <IconSearch />
               <span className={styles.searchText}>Search</span>
               <span className={styles.searchShortcut}>Ctrl+K</span>
            </button>

            <div className={styles.actions}>
               <Link
                  href="/dashboard/developer"
                  className={styles.iconBtn}
                  aria-label="Developer"
               >
                  <IconCode />
                  <span className={styles.tt}>Developer</span>
               </Link>

               <Link
                  href="/dashboard/support"
                  className={styles.iconBtn}
                  aria-label="Help"
               >
                  <IconHelp />
                  <span className={styles.tt}>Help &amp; Support</span>
               </Link>

               <button
                  className={styles.iconBtn}
                  aria-label="What's new"
                  onClick={() => setSearchOpen(true)}
               >
                  <IconSparkle />
                  <span className={styles.tt}>What&apos;s new</span>
               </button>

               <div className={styles.notifWrap} ref={notifRef}>
                  <button
                     className={styles.iconBtn}
                     aria-label="Notifications"
                     onClick={() => setNotifOpen((o) => !o)}
                  >
                     <IconBell />
                     {unreadCount > 0 && (
                        <span className={styles.badge}>
                           {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                     )}
                     <span className={styles.tt}>Notifications</span>
                  </button>

                  {notifOpen && (
                     <div className={styles.notifMenu}>
                        <div className={styles.notifHead}>
                           Notifications
                           {unreadCount > 0 && (
                              <span>{unreadCount} unread</span>
                           )}
                        </div>
                        {!user ? (
                           <p className={styles.notifEmpty}>
                              Sign in to view notifications.
                           </p>
                        ) : notifications.length === 0 ? (
                           <p className={styles.notifEmpty}>
                              You&apos;re all caught up.
                           </p>
                        ) : (
                           <div className={styles.notifList}>
                              {notifications.slice(0, 8).map((notification) => (
                                 <button
                                    key={notification.id}
                                    className={`${styles.notifItem} ${notification.read ? styles.notifItemRead : ""}`}
                                    onClick={() =>
                                       openNotification(notification)
                                    }
                                 >
                                    {!notification.read && (
                                       <span className={styles.notifDot} />
                                    )}
                                    <span className={styles.notifCopy}>
                                       <span className={styles.notifTitle}>
                                          {notification.title}
                                       </span>
                                       <span className={styles.notifMessage}>
                                          {notification.message}
                                       </span>
                                       <span className={styles.notifTime}>
                                          {new Date(
                                             notification.createdAt,
                                          ).toLocaleString()}
                                       </span>
                                    </span>
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                  )}
               </div>

               <Link
                  href="/dashboard/messages"
                  className={styles.iconBtn}
                  aria-label="Messages"
               >
                  <IconMessage />
                  <span className={styles.tt}>Messages</span>
               </Link>

               {loading ? (
                  <div className={styles.skeleton} />
               ) : !user ? (
                  <button
                     className={styles.loginBtn}
                     onClick={() => setAuthOpen(true)}
                  >
                     Login
                  </button>
               ) : (
                  <div className={styles.userWrap} ref={userRef}>
                     <button
                        className={styles.userBtn}
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-expanded={menuOpen}
                     >
                        <div className={styles.avatar}>
                           {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.name} />
                           ) : (
                              user.name.charAt(0).toUpperCase()
                           )}
                        </div>
                        <IconChevronDown />
                     </button>

                     {menuOpen && (
                        <div className={styles.menu}>
                           <div className={styles.menuHeader}>
                              <div className={styles.menuAvatar}>
                                 {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} />
                                 ) : (
                                    user.name.charAt(0).toUpperCase()
                                 )}
                              </div>
                              <div className={styles.menuMeta}>
                                 <strong>{user.name}</strong>
                                 <span>{user.email}</span>
                              </div>
                           </div>

                           <Link
                              href="/dashboard"
                              className={styles.menuItem}
                              onClick={() => setMenuOpen(false)}
                           >
                              Dashboard
                           </Link>
                           <Link
                              href="/dashboard/settings"
                              className={styles.menuItem}
                              onClick={() => setMenuOpen(false)}
                           >
                              Settings
                           </Link>

                           <div className={styles.menuDivider} />
                           <button
                              className={`${styles.menuItem} ${styles.menuItemDanger}`}
                              onClick={handleLogout}
                           >
                              Log out
                           </button>
                        </div>
                     )}
                  </div>
               )}
            </div>
         </header>

         <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

         <AuthModal
            open={authOpen}
            onClose={() => setAuthOpen(false)}
            onSuccess={() => {
               setAuthOpen(false);
               router.push("/dashboard");
            }}
         />
      </>
   );
}
