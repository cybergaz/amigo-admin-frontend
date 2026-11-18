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
  Flag,
  UserX,
  LifeBuoy,
  LogIn,
} from "lucide-react";
import type { UserPermissions } from "@/lib/api-client";

const can = (perm: string) => (p: UserPermissions) =>
  p.role === "admin" || p.permissions.includes(perm);
const superAdmin = (p: UserPermissions) => p.role === "admin";
const anyAdmin = (p: UserPermissions) => p.role === "admin" || p.role === "sub_admin";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, value: "dashboard", canView: can("dashboard") },
  { href: "/dashboard/manage-groups", label: "Manage Groups", icon: Users, value: "groups", canView: can("manage-groups") },
  { href: "/dashboard/manage-chats", label: "Manage Chats", icon: MessageSquare, value: "chats", canView: can("manage-chats") },
  { href: "/dashboard/admin-management", label: "Admin Management", icon: UserCheck, value: "admins", canView: can("admin-management") },
  { href: "/dashboard/new-users-requests", label: "New Users Requests", icon: UserPlus, value: "new-users", canView: can("admin-management") },
  { href: "/dashboard/device-requests", label: "Device Requests", icon: MonitorSmartphone, value: "device-requests", canView: can("admin-management") },
  { href: "/dashboard/marquee-banner", label: "Marquee Banner", icon: Megaphone, value: "marquee-banner", canView: superAdmin },
  { href: "/dashboard/admin-pin-usage", label: "Admin PIN Usage", icon: ShieldAlert, value: "admin-pin-usage", canView: superAdmin },
  // requiresPinLogin: hidden (not removed) while the "PIN login" switch is off.
  { href: "/dashboard/pin-reset-requests", label: "Reset PIN Requests", icon: KeyRound, value: "pin-reset-requests", canView: superAdmin, requiresPinLogin: true },
  { href: "/dashboard/reports", label: "Reports", icon: Flag, value: "reports", canView: can("manage-chats") },
  { href: "/dashboard/deleted-accounts", label: "Deleted Accounts", icon: UserX, value: "deleted-accounts", canView: anyAdmin },
  { href: "/dashboard/recovery-requests", label: "Recovery Requests", icon: LifeBuoy, value: "recovery-requests", canView: superAdmin },
  { href: "/dashboard/login-methods", label: "Login Methods", icon: LogIn, value: "login-methods", canView: superAdmin },
] as const;
