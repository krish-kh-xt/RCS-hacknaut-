const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const HomeIcon = (p) => (
  <svg {...base} {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>
);
export const BellIcon = (p) => (
  <svg {...base} {...p}><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 004 0" /></svg>
);
export const UserIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
);
export const RefreshIcon = (p) => (
  <svg {...base} width={14} height={14} {...p}><path d="M21 12a9 9 0 10-3 6.7" /><path d="M21 4v6h-6" /></svg>
);
export const CheckIcon = (p) => (
  <svg {...base} {...p}><path d="M5 12l5 5 9-10" /></svg>
);
export const UsersIcon = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14.5c3 0 5 1.5 5 4" /></svg>
);
export const AlertIcon = (p) => (
  <svg {...base} {...p}><path d="M12 8v5" /><circle cx="12" cy="17" r="0.8" fill="currentColor" /></svg>
);
export const ChevronDown = (p) => (
  <svg {...base} width={12} height={12} {...p}><path d="M6 9l6 6 6-6" /></svg>
);
export const CalendarIcon = (p) => (
  <svg {...base} width={14} height={14} {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const SortIcon = (p) => (
  <svg {...base} width={10} height={10} {...p}><path d="M8 4v16M8 4l-3 3M8 4l3 3M16 20V4M16 20l-3-3M16 20l3-3" /></svg>
);

export function ShieldLogo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 3l17 6v13c0 11-7 19-17 23C14 41 7 33 7 22V9z" fill="#f5c518" />
      <path d="M24 8l12 4.3V22c0 8-5 14-12 17-7-3-12-9-12-17v-9.7z" fill="#12182b" />
      <path d="M24 14a6.5 6.5 0 00-6.5 6.5c0 4.5 6.5 11 6.5 11s6.5-6.5 6.5-11A6.5 6.5 0 0024 14z" fill="#f5c518" />
      <circle cx="24" cy="20.5" r="2.4" fill="#12182b" />
    </svg>
  );
}
