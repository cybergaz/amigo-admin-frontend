"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, MessageSquare, Settings, LayoutDashboard, Bell, UserCheck, UserPlus, Megaphone, ShieldAlert, MonitorSmartphone, KeyRound } from "lucide-react";
import Header from "@/components/common/header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/animated-shadcn-tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { api_client, type UserPermissions } from "@/lib/api-client";
import BouncingBalls from "@/components/ui/bouncing-balls";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const response = await api_client.getUserPermissions();
      if (response.success && response.data) {
        setUserPermissions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch user permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission for a specific route
  const hasPermission = (permission: string) => {
    if (!userPermissions) return false;
    if (userPermissions.role === "admin") return true; // Super admin has all permissions
    return userPermissions.permissions.includes(permission);
  };

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === "/dashboard") return "dashboard";
    if (pathname === "/dashboard/manage-groups") return "groups";
    if (pathname === "/dashboard/manage-chats") return "chats";
    // if (pathname === "/dashboard/notifications") return "notifications";
    if (pathname === "/dashboard/admin-management") return "admins";
    if (pathname === "/dashboard/new-users-requests") return "new-users";
    if (pathname === "/dashboard/marquee-banner") return "marquee-banner";
    if (pathname === "/dashboard/admin-pin-usage") return "admin-pin-usage";
    if (pathname === "/dashboard/pin-reset-requests") return "pin-reset-requests";
    if (pathname === "/dashboard/device-requests") return "device-requests";
    return "dashboard"; // fallback to dashboard
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BouncingBalls balls={4} className=" fill-black stroke-black" animation="animate-bounce-md" />
      </div>
    );
  }

  return (
    <>
      <Header className="" />

      <Tabs value={getActiveTab()} className="w-full sticky top-0 bg-white overflow-x-scroll z-40">
        <TabsList
          className="flex gap-16 p-1 px-5 w-full h-14 bg-transparent rounded-none border-b border-1 data-[state=active]:text-accent-rblue"
          indicatorClassName="bg-white shadow-none bg-accent-rblue/0 border-t-0 border-r-0 border-l-0 border-b border-b-3 rounded-none border-accent-rblue-dark"
        >
          {hasPermission("dashboard") && (
            <TabsTrigger value="dashboard" asChild
              className="px-8 data-[state=active]:text-accent-rblue-dark text-accent-gray flex items-center gap-2">
              <Link href={"/dashboard"} className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </TabsTrigger>
          )}
          {hasPermission("manage-groups") && (
            <TabsTrigger value="groups" asChild
              className="px-8 data-[state=active]:text-accent-rblue-dark text-accent-gray flex items-center gap-2">
              <Link href={"/dashboard/manage-groups"} className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Manage Groups
              </Link>
            </TabsTrigger>
          )}
          {hasPermission("manage-chats") && (
            <TabsTrigger value="chats" asChild
              className="px-8 data-[state=active]:text-accent-rblue-dark text-accent-gray flex items-center gap-2">
              <Link href={"/dashboard/manage-chats"} className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Manage Chats
              </Link>
            </TabsTrigger>
          )}
          {/* <TabsTrigger value="notifications" asChild */}
          {/*   className="px-8 data-[state=active]:text-accent-rblue-dark text-accent-gray flex items-center gap-2"> */}
          {/*   <Link href={"/dashboard/notifications"} className="flex items-center gap-2"> */}
          {/*     <Bell className="w-4 h-4" /> */}
          {/*     Notifications */}
          {/*   </Link> */}
          {/* </TabsTrigger> */}
          {hasPermission("admin-management") && (
            <TabsTrigger value="admins" asChild
              className="px-8 data-[state=active]:text-accent-rblue-dark text-accent-gray flex items-center gap-2">
              <Link href={"/dashboard/admin-management"} className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Admin Management
              </Link>
            </TabsTrigger>
          )}
          {hasPermission("admin-management") && (
            <TabsTrigger value="new-users" asChild
              className="px-8 data-[state=active]:text-accent-rblue-dark text-accent-gray flex items-center gap-2">
              <Link href={"/dashboard/new-users-requests"} className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                New Users Requests
              </Link>
            </TabsTrigger>
          )}
          {/* Device change requests — super-admin and sub-admins with admin-management */}
          {hasPermission("admin-management") && (
            <TabsTrigger value="device-requests" asChild
              className="px-8 data-[state=active]:text-accent-rblue-dark text-accent-gray flex items-center gap-2">
              <Link href={"/dashboard/device-requests"} className="flex items-center gap-2">
                <MonitorSmartphone className="w-4 h-4" />
                Device Requests
              </Link>
            </TabsTrigger>
          )}
          {/* Super-admin only — sub-admins never see the global banner control */}
          {userPermissions?.role === "admin" && (
            <TabsTrigger value="marquee-banner" asChild
              className="px-8 data-[state=active]:text-accent-rblue-dark text-accent-gray flex items-center gap-2">
              <Link href={"/dashboard/marquee-banner"} className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Marquee Banner
              </Link>
            </TabsTrigger>
          )}
          {/* Super-admin only — Admin PIN (camouflage/duress) usage history */}
          {userPermissions?.role === "admin" && (
            <TabsTrigger value="admin-pin-usage" asChild
              className="px-8 data-[state=active]:text-accent-rblue-dark text-accent-gray flex items-center gap-2">
              <Link href={"/dashboard/admin-pin-usage"} className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Admin PIN Usage
              </Link>
            </TabsTrigger>
          )}

          {/* Super-admin only — user-raised forgot-PIN reset requests */}
          {userPermissions?.role === "admin" && (
            <TabsTrigger value="pin-reset-requests" asChild
              className="px-8 data-[state=active]:text-accent-rblue-dark text-accent-gray flex items-center gap-2">
              <Link href={"/dashboard/pin-reset-requests"} className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Reset PIN Requests
              </Link>
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      <main className="">
        {children}
      </main>

    </>
  );
}

