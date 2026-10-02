"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHead } from "@/components/ui/Page";
import styles from "./townhall.module.css";

type TownhallPost = {
   id: string;
   authorId: string;
   authorName: string;
   body: string;
   createdAt: string;
};

export default function Page() {
   const { user } = useAuth();
   const [posts, setPosts] = useState<TownhallPost[]>([]);
   const [draft, setDraft] = useState("");
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [error, setError] = useState("");

   const loadPosts = async () => {
      setError("");
      try {
         const response = await fetch("/api/townhall", { cache: "no-store" });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not load posts.");
         setPosts(data.posts ?? []);
      } catch (err) {
         setError(err instanceof Error ? err.message : "Could not load posts.");
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      void loadPosts();
   }, []);

   const submit = async (event: FormEvent) => {
      event.preventDefault();
      if (!draft.trim() || saving) return;
      setSaving(true);
      setError("");
      try {
         const response = await fetch("/api/townhall", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: draft }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not publish post.");
         setPosts((current) => [data.post, ...current]);
         setDraft("");
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not publish post.",
         );
      } finally {
         setSaving(false);
      }
   };

   return (
      <div className={styles.page}>
         <PageHead
            title="Townhall"
            subtitle="Share updates with the community."
         />
         <form className={styles.composer} onSubmit={submit}>
            <div className={styles.composerIdentity}>
               {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className={styles.composerBody}>
               <textarea
                  aria-label="Write a community post"
                  placeholder="Share an update with the community…"
                  maxLength={2000}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
               />
               <div className={styles.composerFooter}>
                  <span>{draft.length}/2000</span>
                  <button type="submit" disabled={saving || !draft.trim()}>
                     {saving ? "Publishing…" : "Publish"}
                  </button>
               </div>
            </div>
         </form>

         {error && (
            <p className={styles.error} role="alert">
               {error}
            </p>
         )}
         {loading ? (
            <p className={styles.empty}>Loading posts…</p>
         ) : posts.length === 0 ? (
            <p className={styles.empty}>No posts yet.</p>
         ) : (
            <div className={styles.feed}>
               {posts.map((post) => (
                  <article className={styles.post} key={post.id}>
                     <div className={styles.postIdentity}>
                        {post.authorName.charAt(0).toUpperCase()}
                     </div>
                     <div className={styles.postBody}>
                        <header>
                           <strong>{post.authorName}</strong>
                           <time dateTime={post.createdAt}>
                              {new Date(post.createdAt).toLocaleString()}
                           </time>
                        </header>
                        <p>{post.body}</p>
                     </div>
                  </article>
               ))}
            </div>
         )}
      </div>
   );
}
