"use client";
import { signIn } from "next-auth/react";
import {
   useEffect,
   useId,
   useRef,
   useState,
   type ChangeEvent,
   type FormEvent,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
// @ts-expect-error CSS side-effect import is handled by the bundler.
import "./styles/AuthFlipCard.css";

type Side = "login" | "signup";
type Errors = Partial<
   Record<"name" | "email" | "password" | "confirm" | "terms" | "role", string>
>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,}$/;

type Props = {
   open: boolean;
   onClose: () => void;
   onSuccess?: () => void;
};

export default function AuthModal({ open, onClose, onSuccess }: Props) {
   const [side, setSide] = useState<Side>("login");
   const isSignup = side === "signup";

   useEffect(() => {
      if (open) setSide("login");
   }, [open]);

   useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
         document.removeEventListener("keydown", onKey);
         document.body.style.overflow = "";
      };
   }, [open, onClose]);

   if (!open) return null;

   const handleSuccess = () => {
      onSuccess?.();
      onClose();
   };

   return (
      <div className="auth-overlay" onMouseDown={onClose}>
         <span className="auth-glow auth-glow--one" aria-hidden="true" />
         <span className="auth-glow auth-glow--two" aria-hidden="true" />
         <span className="auth-glow auth-glow--three" aria-hidden="true" />

         <div
            className={`auth-card ${isSignup ? "is-flipped" : ""}`}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
         >
            <button
               type="button"
               className="auth-close"
               onClick={onClose}
               aria-label="Close"
            >
               <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
               >
                  <path d="M18 6 6 18M6 6l12 12" />
               </svg>
            </button>

            <div className="auth-inner">
               <section
                  className="auth-face auth-face--front"
                  aria-hidden={isSignup}
               >
                  <LoginForm
                     onSwitch={() => setSide("signup")}
                     onSuccess={handleSuccess}
                  />
               </section>

               <section
                  className="auth-face auth-face--back"
                  aria-hidden={!isSignup}
               >
                  <SignupForm
                     onSwitch={() => setSide("login")}
                     onSuccess={handleSuccess}
                  />
               </section>
            </div>
         </div>
      </div>
   );
}

/* ================================
   Shared bits
================================ */

function Logo() {
   return (
      <div className="auth-logo" aria-hidden="true">
         <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
               d="M12 3.5 20.5 8v8L12 20.5 3.5 16V8L12 3.5Z"
               stroke="url(#lg)"
               strokeWidth="1.8"
               strokeLinejoin="round"
            />
            <path
               d="M12 8 16.5 10.5v4L12 17l-4.5-2.5v-4L12 8Z"
               stroke="url(#lg)"
               strokeWidth="1.6"
               strokeLinejoin="round"
            />
            <defs>
               <linearGradient
                  id="lg"
                  x1="3.5"
                  y1="3.5"
                  x2="20.5"
                  y2="20.5"
                  gradientUnits="userSpaceOnUse"
               >
                  <stop stopColor="#7ff0e6" />
                  <stop offset="1" stopColor="#b4a8ff" />
               </linearGradient>
            </defs>
         </svg>
      </div>
   );
}

function GoogleIcon() {
   return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
         <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
         />
         <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
         />
         <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
         />
         <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
         />
      </svg>
   );
}

function FacebookIcon() {
   return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
         <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
   );
}

function EyeButton({
   shown,
   onToggle,
}: {
   shown: boolean;
   onToggle: () => void;
}) {
   return (
      <button
         type="button"
         className="field__toggle"
         onClick={onToggle}
         aria-label={shown ? "Hide password" : "Show password"}
         aria-pressed={shown}
      >
         {shown ? (
            <svg
               width="16"
               height="16"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="1.8"
               strokeLinecap="round"
               strokeLinejoin="round"
            >
               <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-10-7-10-7a17.6 17.6 0 0 1 4.06-4.94" />
               <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a17.6 17.6 0 0 1-3.16 4.19" />
               <path d="M1 1l22 22" />
               <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
            </svg>
         ) : (
            <svg
               width="16"
               height="16"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="1.8"
               strokeLinecap="round"
               strokeLinejoin="round"
            >
               <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
               <circle cx="12" cy="12" r="3" />
            </svg>
         )}
      </button>
   );
}

function OAuthRow({ mode }: { mode: "login" | "signup" }) {
   const [loading, setLoading] = useState<"google" | "facebook" | null>(null);
   const [error, setError] = useState("");

   const handleOAuth = async (provider: "google" | "facebook") => {
      setError("");
      setLoading(provider);
      try {
         await signIn(provider, { callbackUrl: "/dashboard" });
      } catch (err) {
         setError(err instanceof Error ? err.message : "OAuth sign-in failed.");
         setLoading(null);
      }
   };

   return (
      <div className="oauth-block">
         <div className="oauth-divider">
            <span>
               {mode === "login" ? "or sign in with" : "or sign up with"}
            </span>
         </div>
         <div className="oauth-row">
            <button
               type="button"
               className="oauth-btn"
               onClick={() => handleOAuth("google")}
               disabled={loading !== null}
            >
               <GoogleIcon />
               <span>{loading === "google" ? "Connecting…" : "Google"}</span>
            </button>
            <button
               type="button"
               className="oauth-btn"
               onClick={() => handleOAuth("facebook")}
               disabled={loading !== null}
            >
               <FacebookIcon />
               <span>
                  {loading === "facebook" ? "Connecting…" : "Facebook"}
               </span>
            </button>
         </div>
         {error && (
            <p className="field__error" style={{ marginTop: 8 }}>
               {error}
            </p>
         )}
      </div>
   );
}

/* ================================
   Login
================================ */

function LoginForm({
   onSwitch,
   onSuccess,
}: {
   onSwitch: () => void;
   onSuccess: () => void;
}) {
   const { login } = useAuth();
   const uid = useId();

   const [identifier, setIdentifier] = useState("");
   const [password, setPassword] = useState("");
   const [showPw, setShowPw] = useState(false);
   const [remember, setRemember] = useState(true);
   const [errors, setErrors] = useState<Errors>({});
   const [serverError, setServerError] = useState("");
   const [loading, setLoading] = useState(false);

   const submit = async (e: FormEvent) => {
      e.preventDefault();
      setServerError("");

      const next: Errors = {};
      const isEmail = identifier.includes("@");
      if (isEmail) {
         if (!EMAIL_RE.test(identifier)) next.email = "Enter a valid email.";
      } else if (!USERNAME_RE.test(identifier)) {
         next.email = "Enter a valid email or username.";
      }
      if (password.length < 8)
         next.password = "Password must be at least 8 characters.";
      setErrors(next);
      if (Object.keys(next).length !== 0) return;

      setLoading(true);
      try {
         // API expects an email. If a username was entered, reject with a friendly hint.
         if (!isEmail) {
            throw new Error("Please use your email address to log in.");
         }
         await login(identifier, password);
         onSuccess();
      } catch (err) {
         setServerError(
            err instanceof Error ? err.message : "Could not log you in.",
         );
      } finally {
         setLoading(false);
      }
   };

   return (
      <form className="auth-form" onSubmit={submit} noValidate>
         <Logo />

         <header className="auth-head">
            <h2>Welcome back</h2>
            <p>Log in to continue.</p>
         </header>

         <div className="field">
            <label htmlFor={`${uid}-id`}>Email or Username</label>
            <input
               id={`${uid}-id`}
               type="text"
               autoComplete="username"
               placeholder="you@example.com"
               value={identifier}
               onChange={(e) => setIdentifier(e.target.value)}
               aria-invalid={!!errors.email}
            />
            {errors.email && (
               <span className="field__error">{errors.email}</span>
            )}
         </div>

         <div className="field">
            <label htmlFor={`${uid}-pw`}>Password</label>
            <div className="field__wrap">
               <input
                  id={`${uid}-pw`}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
               />
               <EyeButton
                  shown={showPw}
                  onToggle={() => setShowPw((s) => !s)}
               />
            </div>
            {errors.password && (
               <span className="field__error">{errors.password}</span>
            )}
         </div>

         <div className="auth-row">
            <label className="check">
               <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
               />
               <span>Remember me</span>
            </label>
            <button type="button" className="link link--button">
               Forgot password?
            </button>
         </div>

         {serverError && (
            <p className="field__error field__error--block" role="alert">
               {serverError}{" "}
               <button
                  type="button"
                  className="link link--button"
                  onClick={() => setServerError("")}
               >
                  Try again
               </button>
            </p>
         )}

         <button type="submit" className="btn" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
         </button>

         <OAuthRow mode="login" />

         <p className="auth-switch">
            Don&apos;t have an account?{" "}
            <button
               type="button"
               className="link link--button"
               onClick={onSwitch}
            >
               Create account
            </button>
         </p>
      </form>
   );
}

/* ================================
   Signup
================================ */

const ROLES = [
   { value: "", label: "Select your role…" },
   { value: "advertiser", label: "Advertiser" },
   { value: "content-creator", label: "Content Creator" },
];

function SignupForm({
   onSwitch,
   onSuccess,
}: {
   onSwitch: () => void;
   onSuccess: () => void;
}) {
   const { signup } = useAuth();
   const uid = useId();
   const fileRef = useRef<HTMLInputElement>(null);

   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [confirm, setConfirm] = useState("");
   const [showPw, setShowPw] = useState(false);
   const [showConfirm, setShowConfirm] = useState(false);
   const [role, setRole] = useState("");
   const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
   const [avatarName, setAvatarName] = useState("");
   const [terms, setTerms] = useState(false);
   const [errors, setErrors] = useState<Errors>({});
   const [serverError, setServerError] = useState("");
   const [loading, setLoading] = useState(false);

   const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
      setAvatarUrl(URL.createObjectURL(file));
      setAvatarName(file.name);
   };

   const clearFile = () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
      setAvatarUrl(null);
      setAvatarName("");
      if (fileRef.current) fileRef.current.value = "";
   };

   useEffect(() => {
      return () => {
         if (avatarUrl) URL.revokeObjectURL(avatarUrl);
      };
   }, [avatarUrl]);

   const submit = async (e: FormEvent) => {
      e.preventDefault();
      setServerError("");

      const next: Errors = {};
      if (name.trim().length < 2) next.name = "Enter your name.";
      if (!EMAIL_RE.test(email)) next.email = "Enter a valid email.";
      if (password.length < 8) next.password = "Use at least 8 characters.";
      if (confirm !== password) next.confirm = "Passwords don't match.";
      if (!role) next.role = "Choose a role.";
      if (!terms) next.terms = "You must accept the terms.";
      setErrors(next);
      if (Object.keys(next).length !== 0) return;

      setLoading(true);
      try {
         await signup(name, email, password);
         onSuccess();
      } catch (err) {
         setServerError(
            err instanceof Error
               ? err.message
               : "Could not create your account.",
         );
      } finally {
         setLoading(false);
      }
   };

   return (
      <form
         className="auth-form auth-form--signup"
         onSubmit={submit}
         noValidate
      >
         <Logo />

         <header className="auth-head">
            <h2>Create account</h2>
            <p>Join in less than a minute.</p>
         </header>

         <div className="field">
            <label htmlFor={`${uid}-name`}>Full name</label>
            <input
               id={`${uid}-name`}
               type="text"
               autoComplete="name"
               placeholder="Ada Lovelace"
               value={name}
               onChange={(e) => setName(e.target.value)}
               aria-invalid={!!errors.name}
            />
            {errors.name && <span className="field__error">{errors.name}</span>}
         </div>

         <div className="field">
            <label htmlFor={`${uid}-email`}>Email</label>
            <input
               id={`${uid}-email`}
               type="email"
               autoComplete="email"
               placeholder="you@example.com"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               aria-invalid={!!errors.email}
            />
            {errors.email && (
               <span className="field__error">{errors.email}</span>
            )}
         </div>

         <div className="field-pair">
            <div className="field">
               <label htmlFor={`${uid}-pw`}>Password</label>
               <div className="field__wrap">
                  <input
                     id={`${uid}-pw`}
                     type={showPw ? "text" : "password"}
                     autoComplete="new-password"
                     placeholder="8+ characters"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     aria-invalid={!!errors.password}
                  />
                  <EyeButton
                     shown={showPw}
                     onToggle={() => setShowPw((s) => !s)}
                  />
               </div>
               {errors.password && (
                  <span className="field__error">{errors.password}</span>
               )}
            </div>

            <div className="field">
               <label htmlFor={`${uid}-confirm`}>Confirm</label>
               <div className="field__wrap">
                  <input
                     id={`${uid}-confirm`}
                     type={showConfirm ? "text" : "password"}
                     autoComplete="new-password"
                     placeholder="Repeat it"
                     value={confirm}
                     onChange={(e) => setConfirm(e.target.value)}
                     aria-invalid={!!errors.confirm}
                  />
                  <EyeButton
                     shown={showConfirm}
                     onToggle={() => setShowConfirm((s) => !s)}
                  />
               </div>
               {errors.confirm && (
                  <span className="field__error">{errors.confirm}</span>
               )}
            </div>
         </div>

         <div className="field">
            <label htmlFor={`${uid}-role`}>Role</label>
            <div className="field__select">
               <select
                  id={`${uid}-role`}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  aria-invalid={!!errors.role}
               >
                  {ROLES.map((r) => (
                     <option
                        key={r.value}
                        value={r.value}
                        disabled={r.value === ""}
                     >
                        {r.label}
                     </option>
                  ))}
               </select>
               <svg
                  className="field__caret"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
               >
                  <path d="m6 9 6 6 6-6" />
               </svg>
            </div>
            {errors.role && <span className="field__error">{errors.role}</span>}
         </div>

         <div className="field">
            <label>
               Profile picture <span className="field__optional">optional</span>
            </label>
            <div className="picture-picker">
               <div className="picture-preview" aria-hidden="true">
                  {avatarUrl ? (
                     <img src={avatarUrl} alt="" />
                  ) : (
                     <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                     >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                     </svg>
                  )}
               </div>
               <div className="picture-actions">
                  <button
                     type="button"
                     className="picture-btn"
                     onClick={() => fileRef.current?.click()}
                  >
                     {avatarName ? "Change picture" : "Choose picture"}
                  </button>
                  {avatarName && (
                     <button
                        type="button"
                        className="picture-remove"
                        onClick={clearFile}
                     >
                        Remove
                     </button>
                  )}
               </div>
               <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onPickFile}
               />
            </div>
         </div>

         <label className="check check--terms">
            <input
               type="checkbox"
               checked={terms}
               onChange={(e) => setTerms(e.target.checked)}
               aria-invalid={!!errors.terms}
            />
            <span>
               I agree to the{" "}
               <a
                  className="link"
                  href="#terms"
                  onClick={(e) => e.preventDefault()}
               >
                  Terms
               </a>{" "}
               and{" "}
               <a
                  className="link"
                  href="#privacy"
                  onClick={(e) => e.preventDefault()}
               >
                  Privacy Policy
               </a>
            </span>
         </label>
         {errors.terms && <span className="field__error">{errors.terms}</span>}

         {serverError && (
            <p className="field__error field__error--block" role="alert">
               {serverError}
            </p>
         )}

         <button type="submit" className="btn" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
         </button>

         <OAuthRow mode="signup" />

         <p className="auth-switch">
            Already have an account?{" "}
            <button
               type="button"
               className="link link--button"
               onClick={onSwitch}
            >
               Log in
            </button>
         </p>
      </form>
   );
}
