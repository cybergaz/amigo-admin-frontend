"use client";

import Header from "@/components/common/header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/animated-shadcn-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api_client, type UserPermissions } from "@/lib/api-client";
import BouncingBalls from "@/components/ui/bouncing-balls";
import { NAV_ITEMS } from "@/lib/nav-items";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  // Keep the active tab scrolled into view within the horizontal strip on
  // narrower desktops where the full 9-tab strip cannot fit at once.
  useEffect(() => {
    const active = document.querySelector<HTMLElement>(
      '[data-slot="tabs-trigger"][data-state="active"]'
    );
    active?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BouncingBalls balls={4} className=" fill-black stroke-black" animation="animate-bounce-md" />
      </div>
    );
  }

  const items = userPermissions
    ? NAV_ITEMS.filter((i) => i.canView(userPermissions))
    : [];
  const activeValue =
    items.find((i) => i.href === pathname)?.value ?? "dashboard";

  return (
    <>
      <Header />

      <div className="sticky top-0 z-40 border-b bg-white">
        <div className="page-shell">
          {/* < lg : dropdown page-switcher (no horizontal scroll on phones/tablets) */}
          <div className="py-2 lg:hidden">
            <Select value={pathname} onValueChange={(href) => router.push(href)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Navigate…" />
              </SelectTrigger>
              <SelectContent>
                {items.map(({ href, label, icon: Icon }) => (
                  <SelectItem key={href} value={href} className="h-11">
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ≥ lg : horizontal tab strip with edge fades */}
          <div className="relative hidden lg:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" />
            <Tabs value={activeValue}>
              <TabsList
                className="w-max justify-start gap-1 rounded-none border-b border-border bg-transparent p-1 h-14"
                indicatorClassName="bg-transparent border-0 border-b-[3px] rounded-none border-accent-rblue-dark shadow-none"
              >
                {items.map(({ href, label, icon: Icon, value }) => (
                  <TabsTrigger
                    key={href}
                    value={value}
                    asChild
                    className="px-3 text-accent-gray data-[state=active]:text-accent-rblue-dark"
                  >
                    <Link href={href} className="flex items-center gap-2 whitespace-nowrap">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <main className="">
        {children}
      </main>
    </>
  );
}
