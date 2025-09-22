"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, MessageSquare, Settings, LayoutDashboard, Bell, UserCheck } from "lucide-react";
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
        </TabsList>
      </Tabs>

      <main className="">
        {children}
      </main>

    </>
  );
}

