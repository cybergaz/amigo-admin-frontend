import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { api_client } from "./api-client";
import { JwtPayload } from "@/types/common.types";
import { user_store } from "@/store/user.store";

if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

const isAuthenticated = async (request: NextRequest) => {
  const token = request.cookies.get("refresh_token")?.value;
  return !!token;
}

const decode_payload_from_token = (token: string) => {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return { success: true, message: "Token decoded", payload: decoded };
  }
  catch (error) {
    return { success: false, message: "Coudn't decode token" };
  }
}

const handle_logout = async (router: AppRouterInstance) => {

  try {
    const res = await api_client.makeRequest("/auth/logout")

    if (res.success) {
      // Clear user store (important for persisted localStorage)
      user_store.getState().clearUser();
      
      // Also manually clear localStorage just to be sure
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user-storage');
      }
      
      router.push("/login");
    } else {
      console.error("Logout failed:", res);
    }
  } catch (err) {
    console.error("Logout error:", err);
  }
};

export { isAuthenticated, decode_payload_from_token, handle_logout };

