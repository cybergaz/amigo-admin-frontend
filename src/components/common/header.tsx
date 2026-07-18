"use client"

import { handle_logout } from "@/lib/auth.service";
import { user_store } from "@/store/user.store";
import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import BouncingBalls from "../ui/bouncing-balls";
import { cn, formatString } from "@/lib/utils";

export default function Header({ className }: { className?: string }) {
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      await user_store.getState().fetchUser()
    }
    fetchUser();
  }, [])

  const user = user_store((state) => state.user);
  const loading = user_store((state) => state.isLoading);

  return (
    <div className={cn("w-full bg-white border-b border-gray-200", className)}>
      <div className="page-shell">
        <div className="flex items-center justify-between gap-2 sm:gap-4 min-h-16 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 bg-gradient-to-r from-accent-blue to-accent-violet-dark rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">A</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Amigo Admin</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">Control Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 rounded-lg px-2 py-1.5 sm:px-4 sm:py-2 min-w-0">
              <div className="w-8 h-8 shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {
                    loading
                      ? <LoaderCircle className="h-4 w-4 animate-spin" />
                      : user?.email?.charAt(0).toUpperCase()
                  }
                </span>
              </div>
              <div className="hidden sm:block min-w-0">
                {
                  loading
                    ? <BouncingBalls balls={4} className=" fill-black stroke-black" animation="animate-bounce-md" />
                    :
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[40vw] lg:max-w-[16rem]">
                        {user?.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{formatString(user?.role === "admin" ? "super admin" : user?.role)}</p>
                    </>
                }
              </div>
            </div>

            {/* Logout Button — icon-only on phones, full label from sm up */}
            <button
              onClick={() => handle_logout(router)}
              className="inline-flex items-center justify-center shrink-0 h-10 touch:h-11 px-3 sm:px-4 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Logout"
            >
              <span className="hidden sm:inline">Logout</span>
              <LogOut className="h-4 w-4 sm:ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
