//src/config/navigation.ts

export interface NavLink {
  href: string;
  label: string;
  isExternal?: boolean;
}

export const PRIMARY_NAV_LINKS: NavLink[] = [
  { href: "/tools", label: "Tools" },
  { href: "/#contact", label: "Contact" },
  { href: "/about", label: "About" },
];
