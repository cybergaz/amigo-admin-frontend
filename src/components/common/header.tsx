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
  console.log("user ->", user)


  return (
    <div className={cn("w-screen bg-white border-b border-gray-200", className)}>
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-accent-blue to-accent-violet-dark rounded-xl flex items-center justify-center">
                <span className="text-white text-lg font-bold">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Amigo Admin</h1>
                <p className="text-sm text-gray-500">Control Panel</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {
                    loading
                      ? <LoaderCircle className="h-4 w-4 animate-spin" />
                      : user?.email?.charAt(0).toUpperCase()
                  }
                </span>
              </div>
              <div className="hidden sm:block">
                {
                  loading
                    ? <BouncingBalls balls={4} className=" fill-black stroke-black" animation="animate-bounce-md" />
                    :
                    <>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.email}
                      </p>
                      <p className="text-xs text-gray-500">{formatString(user?.role === "admin" ? "super admin" : user?.role)}</p>
                    </>
                }
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => handle_logout(router)}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Logout"
            >
              Logout
              <LogOut className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
