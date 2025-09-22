import { api_client } from "./api-client";
import { ApiResponse } from "@/types/common.types";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  id: string;
  name: string;
  role: string;
  phone: string;
  access_token?: string;
  refresh_token?: string;
}

export const loginWithEmail = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  return api_client.makeRequest<LoginResponse>("/auth/verify-email-login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

export const logout = async (): Promise<ApiResponse> => {
  return api_client.makeRequest("/auth/logout", {
    method: "GET",
  });
};
