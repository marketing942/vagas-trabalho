import type { SVGProps } from "react";

export type IconName =
  | "cap" | "heart" | "users" | "star" | "pin" | "clock" | "search" | "arrow"
  | "briefcase" | "book" | "chat" | "spark" | "building" | "check" | "calendar" | "sun"
  | "close" | "mountain" | "flag";

const PATHS: Record<IconName, React.ReactNode> = {
  cap: (<><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" /><path d="M22 10v6" /></>),
  heart: (<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />),
  users: (<><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.500V20" /><circle cx="10" cy="8" r="3.5" /><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.350" /><path d="M15.500 4.700a3.500 3.500 0 0 1 0 6.600" /></>),
  star: (<path d="m12 3 2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9L12 3Z" />),
  pin: (<><path d="M12 21s-6.500-5.700-6.500-11a6.500 6.500 0 0 1 13 0C18.500 15.300 12 21 12 21Z" /><circle cx="12" cy="10" r="2.300" /></>),
  clock: (<><circle cx="12" cy="12" r="8.500" /><path d="M12 7.500V12l3 2" /></>),
  search: (<><circle cx="11" cy="11" r="6.500" /><path d="m20 20-4.200-4.200" /></>),
  arrow: (<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>),
  briefcase: (<><rect x="3" y="7.500" width="18" height="12" rx="2.500" /><path d="M9 7.500V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.500" /><path d="M3 13h18" /></>),
  book: (<><path d="M4 5.500A2.500 2.500 0 0 1 6.500 3H20v15H6.500A2.500 2.500 0 0 0 4 20.500V5.500Z" /><path d="M4 20.500A2.500 2.500 0 0 0 6.500 23H20" /></>),
  chat: (<path d="M20 12a8 8 0 0 1-11.600 7.100L4 20l1-4.100A8 8 0 1 1 20 12Z" />),
  spark: (<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.500 2.500M15.500 15.500 18 18M18 6l-2.500 2.500M8.500 15.500 6 18" />),
  building: (<><path d="M4 21V5l8-2 8 2v16" /><path d="M9 21v-4h6v4M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01" /></>),
  check: (<path d="m5 12.500 4.500 4.500L19 7.500" />),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2.500v2.200M12 19.300v2.200M4.600 4.600l1.600 1.600M17.800 17.800l1.600 1.600M2.500 12h2.200M19.300 12h2.200M4.600 19.400l1.600-1.600M17.800 6.200l1.600-1.600" /></>),
  close: (<path d="M6 6l12 12M18 6 6 18" />),
  mountain: (<><path d="m3 20 6.500-11 4 6.500 2.500-4L21 20H3Z" /><path d="m9 9 1.800 2.800" /></>),
  flag: (<><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>),
  calendar: (<><rect x="3.500" y="5" width="17" height="15.500" rx="2.500" /><path d="M8 3v4M16 3v4M3.500 10h17" /></>),
};

export default function Icon({
  name,
  className = "h-5 w-5",
  ...rest
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
