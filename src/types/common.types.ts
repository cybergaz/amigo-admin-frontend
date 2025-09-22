const ROLE_CONST = ["user", "admin", "sub_admin"] as const;
type RoleType = typeof ROLE_CONST[number];


interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: number;
}

type JwtPayload = {
  id: string;
  role: RoleType;
  is_profile_complete: boolean;
  iat: number;
  exp: number;
}

export { ROLE_CONST };
export type { RoleType, ApiResponse, JwtPayload };
