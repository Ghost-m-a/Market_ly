"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import styles from "./messages.module.css";

type Conversation = {
   id: string;
   title: string | null;
   isGroup: boolean;
   avatarUrl: string | null;
   lastMessage: {
      body: string;
      senderName: string;
      createdAt: string;
      isMine: boolean;
   } | null;
   unreadCount: number;
   updatedAt: string;
};

type Message = {
   id: string;
   body: string;
   senderId: string;
   senderName: string;
   senderImage: string | null;
   createdAt: string;
   isMine: boolean;
};

function timeAgo(iso: string): string {
   const d = new Date(iso);
   const now = new Date();
   const diff = (now.getTime() - d.getTime()) / 1000;

   if (diff < 60) return "now";
   if (diff < 3600) return `${Math.floor(diff / 60)}m`;
   if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
   if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
   return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MessagesContent() {
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();
   const activeId = searchParams.get("c");

   const [conversations, setConversations] = useState<Conversation[]>([]);
   const [loadingList, setLoadingList] = useState(true);

   const [messages, setMessages] = useState<Message[]>([]);
   const [chatTitle, setChatTitle] = useState("");
   const [chatAvatar, setChatAvatar] = useState<string | null>(null);
   const [loadingChat, setLoadingChat] = useState(false);

   const [filter, setFilter] = useState<"all" | "unread" | "requests">("all");
   const [search, setSearch] = useState("");
   const [draft, setDraft] = useState("");
   const [sending, setSending] = useState(false);

   const messagesEndRef = useRef<HTMLDivElement>(null);

   /* ---------- Load conversations ---------- */
   const loadConversations = useCallback(async () => {
      try {
         const res = await fetch("/api/conversations", { cache: "no-store" });
         const data = await res.json();
         setConversations(data.conversations ?? []);
      } finally {
         setLoadingList(false);
      }
   }, []);

   useEffect(() => {
      loadConversations();
   }, [loadConversations]);

   /* ---------- Load active conversation messages ---------- */
   useEffect(() => {
      if (!activeId) {
         setMessages([]);
         setChatTitle("");
         setChatAvatar(null);
         return;
      }
      setLoadingChat(true);
      fetch(`/api/conversations/${activeId}/messages`, { cache: "no-store" })
         .then((r) => r.json())
         .then((d) => {
            setMessages(d.messages ?? []);
            setChatTitle(d.title ?? "");
            setChatAvatar(d.avatarUrl ?? null);
         })
         .finally(() => setLoadingChat(false));

      // Mark as read
      fetch(`/api/conversations/${activeId}/read`, { method: "POST" })
         .then(() => {
            setConversations((cur) =>
               cur.map((c) =>
                  c.id === activeId ? { ...c, unreadCount: 0 } : c,
               ),
            );
         })
         .catch(() => {});
   }, [activeId]);

   /* ---------- Auto-scroll to newest ---------- */
   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [messages.length]);

   /* ---------- Send message ---------- */
   const send = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!draft.trim() || !activeId || sending) return;

      setSending(true);
      try {
         const res = await fetch(`/api/conversations/${activeId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: draft }),
         });
         const data = await res.json();
         if (res.ok) {
            setMessages((m) => [...m, data.message]);
            setDraft("");
            loadConversations();
         }
      } finally {
         setSending(false);
      }
   };

   /* ---------- Filter conversations ---------- */
   const filtered = conversations.filter((c) => {
      if (filter === "unread" && c.unreadCount === 0) return false;
      if (filter === "requests") return false;
      if (search) {
         const q = search.toLowerCase();
         const matchTitle = c.title?.toLowerCase().includes(q);
         const matchBody = c.lastMessage?.body.toLowerCase().includes(q);
         if (!matchTitle && !matchBody) return false;
      }
      return true;
   });

   const unreadTotal = conversations.filter((c) => c.unreadCount > 0).length;

   /* ---------- Select conversation ---------- */
   const select = (id: string) => {
      router.push(`${pathname}?c=${id}`);
   };

   return (
      <div className={styles.wrap}>
         {/* ============ Column 1: list ============ */}
         <aside className={styles.list}>
            <div className={styles.listHead}>
               <div className={styles.searchBox}>
                  <svg
                     width="14"
                     height="14"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                  >
                     <circle cx="11" cy="11" r="8" />
                     <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                     placeholder="Search…"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                  />
               </div>
               <button
                  className={styles.newChatBtn}
                  onClick={async () => {
                     const email = prompt("Start a chat with (email):");
                     if (!email) return;
                     const res = await fetch("/api/conversations/start", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                     });
                     const data = await res.json();
                     if (res.ok) {
                        await loadConversations();
                        router.push(`${pathname}?c=${data.conversationId}`);
                     } else {
                        alert(data.message ?? "Could not start chat.");
                     }
                  }}
                  title="New conversation"
               >
                  <svg
                     width="16"
                     height="16"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                  >
                     <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
               </button>
            </div>

            <div className={styles.tabs}>
               <button
                  className={`${styles.tab} ${filter === "all" ? styles.tabActive : ""}`}
                  onClick={() => setFilter("all")}
               >
                  All
               </button>
               <button
                  className={`${styles.tab} ${filter === "unread" ? styles.tabActive : ""}`}
                  onClick={() => setFilter("unread")}
               >
                  <span className={styles.tabDot} />
                  Unread{" "}
                  {unreadTotal > 0 && (
                     <span className={styles.tabCount}>{unreadTotal}</span>
                  )}
               </button>
               <button
                  className={`${styles.tab} ${filter === "requests" ? styles.tabActive : ""}`}
                  onClick={() => setFilter("requests")}
               >
                  Requests
               </button>
            </div>

            <div className={styles.convoList}>
               {loadingList ? (
                  <div className={styles.emptyList}>Loading…</div>
               ) : filtered.length === 0 ? (
                  <div className={styles.emptyList}>
                     <p>No conversations yet.</p>
                     <p className={styles.emptyHint}>
                        Click the pencil to start one.
                     </p>
                  </div>
               ) : (
                  filtered.map((c) => (
                     <button
                        key={c.id}
                        className={`${styles.convo} ${c.id === activeId ? styles.convoActive : ""}`}
                        onClick={() => select(c.id)}
                     >
                        <div className={styles.convoAvatar}>
                           {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt="" />
                           ) : (
                              (c.title ?? "?").charAt(0).toUpperCase()
                           )}
                        </div>
                        <div className={styles.convoBody}>
                           <div className={styles.convoTop}>
                              <span className={styles.convoName}>
                                 {c.title}
                              </span>
                              <span className={styles.convoTime}>
                                 {c.lastMessage
                                    ? timeAgo(c.lastMessage.createdAt)
                                    : ""}
                              </span>
                           </div>
                           <div className={styles.convoPreview}>
                              {c.lastMessage ? (
                                 <>
                                    {c.lastMessage.isMine && (
                                       <span className={styles.you}>You: </span>
                                    )}
                                    {c.lastMessage.body}
                                 </>
                              ) : (
                                 <span className={styles.empty}>
                                    No messages yet
                                 </span>
                              )}
                           </div>
                        </div>
                        {c.unreadCount > 0 && (
                           <span className={styles.unreadBadge}>
                              {c.unreadCount}
                           </span>
                        )}
                     </button>
                  ))
               )}
            </div>
         </aside>

         {/* ============ Column 2: chat ============ */}
         <section className={styles.chat}>
            {!activeId ? (
               <div className={styles.emptyChat}>
                  <svg
                     width="90"
                     height="90"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="1.2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     className={styles.emptyChatIcon}
                  >
                     <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
                  </svg>
                  <h3>Select a conversation</h3>
                  <p>
                     Choose a chat from the sidebar,
                     <br />
                     or start a new one to say hello.
                  </p>
               </div>
            ) : (
               <>
                  <header className={styles.chatHead}>
                     <div className={styles.chatAvatar}>
                        {chatAvatar ? (
                           <img src={chatAvatar} alt="" />
                        ) : (
                           chatTitle.charAt(0).toUpperCase()
                        )}
                     </div>
                     <div>
                        <div className={styles.chatName}>{chatTitle}</div>
                        <div className={styles.chatStatus}>Active now</div>
                     </div>
                  </header>

                  <div className={styles.chatBody}>
                     {loadingChat ? (
                        <div className={styles.emptyList}>Loading…</div>
                     ) : messages.length === 0 ? (
                        <div className={styles.emptyList}>
                           <p>No messages yet.</p>
                           <p className={styles.emptyHint}>
                              Send the first one below.
                           </p>
                        </div>
                     ) : (
                        messages.map((m) => (
                           <div
                              key={m.id}
                              className={`${styles.bubbleRow} ${m.isMine ? styles.bubbleRowMine : ""}`}
                           >
                              {!m.isMine && (
                                 <div className={styles.bubbleAvatar}>
                                    {m.senderImage ? (
                                       <img src={m.senderImage} alt="" />
                                    ) : (
                                       m.senderName.charAt(0).toUpperCase()
                                    )}
                                 </div>
                              )}
                              <div
                                 className={`${styles.bubble} ${m.isMine ? styles.bubbleMine : ""}`}
                              >
                                 <p className={styles.bubbleText}>{m.body}</p>
                                 <span className={styles.bubbleTime}>
                                    {new Date(m.createdAt).toLocaleTimeString(
                                       "en-US",
                                       {
                                          hour: "numeric",
                                          minute: "2-digit",
                                       },
                                    )}
                                 </span>
                              </div>
                           </div>
                        ))
                     )}
                     <div ref={messagesEndRef} />
                  </div>

                  <form className={styles.composer} onSubmit={send}>
                     <input
                        className={styles.composerInput}
                        placeholder="Message…"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        disabled={sending}
                        autoFocus
                     />
                     <button
                        type="submit"
                        className={styles.sendBtn}
                        disabled={!draft.trim() || sending}
                        aria-label="Send"
                     >
                        <svg
                           width="18"
                           height="18"
                           viewBox="0 0 24 24"
                           fill="none"
                           stroke="currentColor"
                           strokeWidth="2"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                        >
                           <path d="m22 2-7 20-4-9-9-4Z" />
                           <path d="M22 2 11 13" />
                        </svg>
                     </button>
                  </form>
               </>
            )}
         </section>
      </div>
   );
}
