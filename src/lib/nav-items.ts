import {
  LayoutDashboard,
  Users,
  MessageSquare,
  UserCheck,
  UserPlus,
  MonitorSmartphone,
  Megaphone,
  ShieldAlert,
  KeyRound,
} from "lucide-react";
import type { UserPermissions } from "@/lib/api-client";

const can = (perm: string) => (p: UserPermissions) =>
  p.role === "admin" || p.permissions.includes(perm);
const superAdmin = (p: UserPermissions) => p.role === "admin";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, value: "dashboard", canView: can("dashboard") },
  { href: "/dashboard/manage-groups", label: "Manage Groups", icon: Users, value: "groups", canView: can("manage-groups") },
  { href: "/dashboard/manage-chats", label: "Manage Chats", icon: MessageSquare, value: "chats", canView: can("manage-chats") },
  { href: "/dashboard/admin-management", label: "Admin Management", icon: UserCheck, value: "admins", canView: can("admin-management") },
  { href: "/dashboard/new-users-requests", label: "New Users Requests", icon: UserPlus, value: "new-users", canView: can("admin-management") },
  { href: "/dashboard/device-requests", label: "Device Requests", icon: MonitorSmartphone, value: "device-requests", canView: can("admin-management") },
  { href: "/dashboard/marquee-banner", label: "Marquee Banner", icon: Megaphone, value: "marquee-banner", canView: superAdmin },
  { href: "/dashboard/admin-pin-usage", label: "Admin PIN Usage", icon: ShieldAlert, value: "admin-pin-usage", canView: superAdmin },
  { href: "/dashboard/pin-reset-requests", label: "Reset PIN Requests", icon: KeyRound, value: "pin-reset-requests", canView: superAdmin },
] as const;
