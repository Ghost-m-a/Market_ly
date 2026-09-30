"use client";

type P = { size?: number };

const base = (size: number) => ({
   width: size,
   height: size,
   viewBox: "0 0 24 24",
   fill: "none",
   stroke: "currentColor",
   strokeWidth: 1.8,
   strokeLinecap: "round" as const,
   strokeLinejoin: "round" as const,
});

export const IPlus = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <path d="M12 5v14M5 12h14" />
   </svg>
);
export const ISearch = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
   </svg>
);
export const ITrash = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
   </svg>
);
export const ICheck = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <path d="m5 12 5 5L20 7" />
   </svg>
);
export const ICopy = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
   </svg>
);
export const IGlobe = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10Z" />
   </svg>
);
export const IDownload = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
   </svg>
);
export const ISend = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
   </svg>
);
export const ICard = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
   </svg>
);
export const IBox = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <path d="m21 8-9-5-9 5v8l9 5 9-5Z" />
      <path d="m3 8 9 5 9-5M12 21V13" />
   </svg>
);
export const ITrendUp = ({ size = 18 }: P) => (
   <svg {...base(size)}>
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
   </svg>
);
