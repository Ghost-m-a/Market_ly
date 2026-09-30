"use client";

import styles from "./field.module.css";

export function Field({
   label,
   value,
   onChange,
   type = "text",
   placeholder,
   required,
   hint,
}: {
   label: string;
   value: string;
   onChange: (v: string) => void;
   type?: string;
   placeholder?: string;
   required?: boolean;
   hint?: string;
}) {
   return (
      <label className={styles.field}>
         <span className={styles.label}>
            {label}
            {required && <span className={styles.req}>*</span>}
         </span>
         <input
            className={styles.input}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
         />
         {hint && <span className={styles.hint}>{hint}</span>}
      </label>
   );
}

export function TextArea({
   label,
   value,
   onChange,
   placeholder,
   rows = 4,
}: {
   label: string;
   value: string;
   onChange: (v: string) => void;
   placeholder?: string;
   rows?: number;
}) {
   return (
      <label className={styles.field}>
         <span className={styles.label}>{label}</span>
         <textarea
            className={styles.input}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
         />
      </label>
   );
}
