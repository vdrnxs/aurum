export interface NavigationItem {
  name: string;
  href: string;
  active?: boolean;
}

export const navigationItems: NavigationItem[] = [
  { name: "Market Data", href: "#", active: true },
  { name: "Analytics", href: "#", active: false },
  { name: "Settings", href: "#", active: false },
];
