import { UserInfo } from "@/store/user.store";
import { ApiResponse } from "@/types/common.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface UserType {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  role: string;
  user_role: string;
  profile_pic: string | null;
  created_at: string;
  last_seen: string;
  call_access: boolean;
  online_status: boolean;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  ip_address: string | null;
  app_version: string | null;
  // Reversible delete: set while the account is deleted (absent on older backends).
  deleted_at?: string | null;
}

interface AdminUserType {
  id: number;
  name: string;
  email: string | null;
  role: string;
  permissions: string[] | null;
  created_at: string;
  online_status: boolean;
}

interface UserPermissions {
  role: string;
  permissions: string[];
  active: boolean;
}

interface MarqueeBanner {
  text: string;
  enabled: boolean;
  updated_at: string | null;
}

interface PaginatedUsersResponse {
  users: UserType[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface AdminPinEvent {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  device_id: string | null;
  device_name: string | null;
  platform: string | null;
  created_at: string;
}

interface AdminPinEventsResponse {
  events: AdminPinEvent[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface PinResetRequest {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  status: string;
  resolved_at: string | null;
  created_at: string;
}

interface PinResetRequestsResponse {
  requests: PinResetRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface DeviceChangeRequest {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  current_device_id: string | null;
  current_device_name: string | null;
  requested_device_id: string | null;
  device_name: string | null;
  platform: string | null;
  reason: string | null;
  status: string;
  review_note: string | null;
  reviewed_at: string | null;
  consumed_at: string | null;
  created_at: string;
}

interface DeviceChangeRequestsResponse {
  requests: DeviceChangeRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface SingleDeviceLock {
  enabled: boolean;
  updated_at: string | null;
}

interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  subAdmins: number;
  callAccess: number;
}

interface Community {
  id: number;
  name: string;
  group_ids?: number[];
  metadata?: any;
  created_at: string;
  updated_at: string;
  deleted: boolean;
}

interface CommunityMember {
  id: number;
  community_id: number;
  user_id: number;
  role: "member" | "admin";
  joined_at: string;
  deleted: boolean;
  user?: UserType;
}

interface CommunityGroup {
  id: number;
  title: string;
  type: string;
  metadata?: any;
  created_at: string;
  active_time_slots?: Array<{ start_time: string; end_time: string }>;
  timezone?: string;
  active_days?: number[];
  members?: Array<{
    id: number;
    user_id: number;
    role: "admin" | "member";
    joined_at: string;
    user?: UserType;
  }>;
}

interface StandaloneGroup {
  id: number;
  creater_id: number;
  type: "group";
  title: string;
  metadata?: any;
  last_message_at?: string;
  created_at: string;
  deleted: boolean;
  members?: Array<{
    id: number;
    user_id: number;
    role: "admin" | "member";
    joined_at: string;
    user?: UserType;
  }>;
}


// --- Account safety: user reports (backend docs/ACCOUNT_SAFETY.md §2.3) ---

type ReportTargetType = "user" | "message" | "group";
type ReportReason = "spam" | "harassment" | "sexual" | "violence" | "scam" | "other";
type ReportStatus = "open" | "reviewed" | "dismissed";
type ReportStatusFilter = "open" | "closed" | "all";

// Live users row; falls back to the evidence snapshot if the FK was nulled.
interface ReportPersonRef {
  id: string;
  name: string | null;
  phone: string | null;
  deleted: boolean;
}

interface ReportChatRef {
  id: string;
  type: string;
  title: string | null;
}

interface ReportListItem {
  id: string;
  target_type: ReportTargetType;
  reason: ReportReason | string;
  note_preview: string | null;
  status: ReportStatus | string;
  created_at: string;
  reporter: ReportPersonRef | null;
  reported_user: ReportPersonRef | null;
  chat: ReportChatRef | null;
  message_id: string | null;
}

interface ReportEvidenceMessage {
  id: string;
  sender_id: string | null;
  type: string;
  body: string | null;
  attachments: { url: string; mime?: string; name?: string }[] | null;
  sent_at: string | null;
}

interface ReportEvidencePerson {
  id: string;
  name: string | null;
  phone: string | null;
}

interface ReportEvidence {
  v: number;
  captured_at: string;
  reporter: ReportEvidencePerson | null;
  reported_user: ReportEvidencePerson | null;
  chat: { id: string; type: string; title: string | null; member_count: number | null } | null;
  reported_message: ReportEvidenceMessage | null;
  recent_messages: ReportEvidenceMessage[] | null;
}

interface ReportDetail extends ReportListItem {
  note: string | null;
  evidence: ReportEvidence | null;
  reporter_blocked: boolean;
  reporter_left: boolean;
  reviewed_at: string | null;
  reviewed_by: { id: string; name: string | null } | null;
  review_note: string | null;
}

interface ReportsResponse {
  reports: ReportListItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}


// --- Reversible account delete + recovery requests (ACCOUNT_RECOVERY_PLAN §4) ---

type AccountDeletedBy = "self" | "admin";

interface DeletedAccount {
  user_id: string;
  // Real name, taken from the snapshot kept at delete time.
  name: string | null;
  phone: string | null;
  deleted_at: string;
  by: AccountDeletedBy | string;
  deleted_by: string | null;
  groups_count: number;
  messages_count: number;
}

interface DeletedAccountGroup {
  chat_id: string;
  name: string | null;
  members_count: number;
  is_owner_before: boolean;
}

interface DeletedAccountDetail extends DeletedAccount {
  snapshot_name: string | null;
  profile_pic: string | null;
  groups: DeletedAccountGroup[];
  last_messages_at: string | null;
}

interface DeletedAccountsResponse {
  items: DeletedAccount[];
  total: number;
}

type RecoveryRequestStatus = "pending" | "restored" | "dismissed";

interface RecoveryRequest {
  id: string;
  phone: string;
  // Name the person typed in the app.
  name: string;
  // Matched deleted account (null if it was erased since).
  user_id: string | null;
  // Stored name of the matched account (from its snapshot).
  account_name: string | null;
  status: RecoveryRequestStatus | string;
  created_at: string;
  resolved_at: string | null;
}

interface RecoveryRequestsResponse {
  items: RecoveryRequest[];
  total: number;
}

// Failure bodies carry a machine code in `error` (house envelope), which the
// shared ApiResponse type does not declare.
const apiErrorCode = (res: ApiResponse<unknown>): string | undefined =>
  (res as ApiResponse<unknown> & { error?: string }).error;


const get_token_from_cookies = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + 'access_token' + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

class ApiClient {

  // token = get_token_from_cookies();

  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {

    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        // "Authorization": this.token ? `Bearer ${this.token}` : "",
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };

    try {
      // console.log(`🚀 API Request: ${options.method || "GET"} -> ${url}`, { body: options.body ? JSON.parse(options.body as string) : undefined, headers: defaultOptions.headers, });

      const response = await fetch(url, defaultOptions);
      const data = await response.json();

      // console.log(`📥 API Response: ${options.method || "GET"} -> ${url}`, { api_res_status: response.status, data, });

      if (!response.ok && response.status === 401) {
        console.error(`❌ API Error: ${options.method || "GET"} ${url}`, data);
        // trying to get access token again from refresh token
        const refresh_response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: "include",
        });

        if (refresh_response.ok) {
          const refreshData = await refresh_response.json();
          console.log('🔄 Token refreshed successfully:', refreshData);

          // Reload the page to apply the new token
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }
        // else {
        //   // console.error('❌ Token refresh failed:', await refresh_response.text());
        //   // remove all auth cookies 
        //   console.error('❌ Token refresh failed. Redirecting to login.');
        //   // document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        //   // document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        //   // Optionally, you can redirect the user to the login page
        //
        //   // Redirect to login page
        //   // if (typeof window !== 'undefined') {
        //   //   window.location.href = '/login';
        //   // }
        // }
      }

      return data;
    } catch (error: any) {
      console.error(`❌ Error Making Api Call: ${options.method || "GET"} ${url}`, error.message);
      return {
        success: false,
        message: "ERROR MakeRequest : Network error or server is unreachable.",
        code: 0,
      }
    }
  }

  async getUsers(page: number = 1, limit: number = 10, search?: string, user_role?: string): Promise<ApiResponse<PaginatedUsersResponse>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return this.makeRequest<PaginatedUsersResponse>(`/admin/fetch-all-users?page=${page}&limit=${limit}${searchParam}&role=${user_role || ''}`);
  }

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.makeRequest<DashboardStats>('/admin/dashboard-stats');
  }

  async updateUserRole(id: number, role: string): Promise<ApiResponse<{ id: number; role: string }>> {
    return this.makeRequest<{ id: number; role: string }>('/admin/update-user-role', {
      method: 'PUT',
      body: JSON.stringify({ id, role }),
    });
  }

  async updateUserCallAccess(id: number, call_access: boolean): Promise<ApiResponse<{ id: number; call_access: boolean }>> {
    return this.makeRequest<{ id: number; call_access: boolean }>('/admin/update-user-call-access', {
      method: 'PUT',
      body: JSON.stringify({ id, call_access }),
    });
  }

  async deleteUser(id: number | string): Promise<ApiResponse<{ id: number; name: string }>> {
    return this.makeRequest<{ id: number; name: string }>(`/admin/delete-user/${id}`, {
      method: 'DELETE',
    });
  }

  // Community Management APIs
  async getCommunities(): Promise<ApiResponse<Community[]>> {
    return this.makeRequest<Community[]>('/community/list-all');
  }

  async getCommunityDetails(communityId: number): Promise<ApiResponse<Community>> {
    return this.makeRequest<Community>(`/community/${communityId}`);
  }

  async createCommunity(name: string, metadata?: any): Promise<ApiResponse<Community>> {
    return this.makeRequest<Community>('/community/create', {
      method: 'POST',
      body: JSON.stringify({ name, metadata }),
    });
  }

  async updateCommunity(communityId: number, data: { name?: string; metadata?: any }): Promise<ApiResponse<Community>> {
    return this.makeRequest<Community>(`/community/${communityId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCommunity(communityId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/community/${communityId}`, {
      method: 'DELETE',
    });
  }

  // Community Members APIs
  async getCommunityMembers(communityId: number): Promise<ApiResponse<CommunityMember[]>> {
    return this.makeRequest<CommunityMember[]>(`/community/${communityId}/members`);
  }

  async addCommunityMembers(communityId: number, user_ids: number[], role?: "member" | "admin"): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/community/${communityId}/members/add`, {
      method: 'POST',
      body: JSON.stringify({ user_ids, role }),
    });
  }

  async removeCommunityMembers(communityId: number, user_ids: number[]): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/community/${communityId}/members/remove`, {
      method: 'POST',
      body: JSON.stringify({ user_ids }),
    });
  }

  // Community Groups APIs
  async getCommunityGroups(communityId: number): Promise<ApiResponse<CommunityGroup[]>> {
    return this.makeRequest<CommunityGroup[]>(`/community/${communityId}/groups`);
  }

  async createCommunityGroup(communityId: number, data: {
    title: string;
    active_time_slots: Array<{ start_time: string; end_time: string }>;
    timezone?: string;
    active_days?: number[];
    member_ids?: number[];
  }): Promise<ApiResponse<CommunityGroup>> {
    return this.makeRequest<CommunityGroup>(`/community/${communityId}/groups/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCommunityGroup(conversationId: number, data: {
    title?: string;
    active_time_slots?: Array<{ start_time: string; end_time: string }>;
    timezone?: string;
    active_days?: number[];
  }): Promise<ApiResponse<CommunityGroup>> {
    return this.makeRequest<CommunityGroup>(`/community/groups/${conversationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCommunityGroup(conversationId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/community/groups/${conversationId}`, {
      method: 'DELETE',
    });
  }

  // Community group management APIs
  async addCommunityGroups(communityId: number, groupIds: number[]): Promise<ApiResponse<{ group_ids: number[] }>> {
    return this.makeRequest<{ group_ids: number[] }>(`/community/${communityId}/groups/add`, {
      method: 'POST',
      body: JSON.stringify({ group_ids: groupIds }),
    });
  }

  async removeCommunityGroups(communityId: number, groupIds: number[]): Promise<ApiResponse<{ group_ids: number[] }>> {
    return this.makeRequest<{ group_ids: number[] }>(`/community/${communityId}/groups/remove`, {
      method: 'POST',
      body: JSON.stringify({ group_ids: groupIds }),
    });
  }

  async getAllCommunityGroups(): Promise<ApiResponse<CommunityGroup[]>> {
    return this.makeRequest<CommunityGroup[]>('/community/all-groups');
  }

  async addGroupToCommunities(groupId: number, communityIds: number[]): Promise<ApiResponse<{ added_to_communities: number; errors?: string[] }>> {
    return this.makeRequest<{ added_to_communities: number; errors?: string[] }>('/community/add-group-to-communities', {
      method: 'POST',
      body: JSON.stringify({ group_id: groupId, community_ids: communityIds }),
    });
  }

  // Standalone Groups APIs
  async getChatList(type?: string): Promise<ApiResponse<StandaloneGroup[]>> {
    const typeParam = type ? `?type=${type}` : '';
    return this.makeRequest<StandaloneGroup[]>(`/chat/get-chat-list/${type || 'all'}${typeParam}`);
  }

  async createGroup(title: string, member_ids?: number[]): Promise<ApiResponse<StandaloneGroup>> {
    return this.makeRequest<StandaloneGroup>('/chat/create-group', {
      method: 'POST',
      body: JSON.stringify({ title, member_ids }),
    });
  }

  async createStandaloneGroup(data: {
    title: string;
    active_time_slots: Array<{ start_time: string; end_time: string }>;
    timezone?: string;
  }): Promise<ApiResponse<CommunityGroup>> {
    return this.makeRequest<CommunityGroup>(`/community/create-standalone-group`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGroupInfo(conversationId: number): Promise<ApiResponse<StandaloneGroup>> {
    return this.makeRequest<StandaloneGroup>(`/chat/get-group-info/${conversationId}`);
  }

  async updateGroupTitle(conversationId: number, title: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>('/chat/update-group-title', {
      method: 'PUT',
      body: JSON.stringify({ conversation_id: conversationId, title }),
    });
  }

  async addGroupMembers(conversationId: number, user_ids: number[], role?: "admin" | "member"): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>('/chat/add-members', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, user_ids, role }),
    });
  }

  async removeGroupMember(conversationId: number, user_id: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>('/chat/remove-member', {
      method: 'DELETE',
      body: JSON.stringify({ conversation_id: conversationId, user_id }),
    });
  }

  async deleteConversation(conversationId: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.makeRequest<{ success: boolean }>(`/chat/delete-conversation/${conversationId}`, {
      method: 'DELETE',
    });
  }

  // Admin Chat Management Methods
  async getChatManagementStats(): Promise<ApiResponse<{
    totalGroups: number;
    adminManagedGroups: number;
    userCreatedGroups: number;
    totalInnerGroups: number;
    totalDirectChats: number;
    totalMembers: number;
  }>> {
    return this.makeRequest(`/admin/chat-management/stats`);
  }

  async getChatManagementGroups(type?: string, page: number = 1, limit: number = 20, search: string = "", showDeleted: boolean = false): Promise<ApiResponse<{
    groups: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    params.append('showDeleted', showDeleted.toString());

    return this.makeRequest(`/admin/chat-management/groups?${params.toString()}`);
  }

  async getChatManagementDirectChats(page: number = 1, limit: number = 10, search: string = ""): Promise<ApiResponse<{
    chats: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }>> {
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    return this.makeRequest(`/admin/chat-management/direct-chats?page=${page}&limit=${limit}${searchParam}`);
  }

  async getChatManagementGroupDetails(conversationId: number): Promise<ApiResponse<{
    members: any[];
    createrId?: number;
    createrName?: string;
    createrProfilePic?: string | null;
    createdAt?: string;
    lastMessageAt?: string;
  }>> {
    return this.makeRequest(`/admin/chat-management/group-details/${conversationId}`);
  }

  async addMemberToChat(conversationId: number, userIds: number[], role: string = 'member'): Promise<ApiResponse<any>> {
    return this.makeRequest('/admin/chat-management/add-member', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        user_ids: userIds,
        role
      })
    });
  }

  async removeMemberFromChat(conversationId: number, userId: number): Promise<ApiResponse<any>> {
    return this.makeRequest('/admin/chat-management/remove-member', {
      method: 'DELETE',
      body: JSON.stringify({
        conversation_id: conversationId,
        user_id: userId
      })
    });
  }

  async getConversationHistory(conversationId: number, page: number = 1, limit: number = 20): Promise<ApiResponse<{
    messages: any[];
    members: any[];
    pagination: any;
  }>> {
    return this.makeRequest(`/admin/chat-management/conversation-history/${conversationId}?page=${page}&limit=${limit}`);
  }

  async getChatManagementCommunities(): Promise<ApiResponse<any[]>> {
    return this.makeRequest('/admin/chat-management/communities');
  }

  async getChatManagementCommunityGroups(communityId: number): Promise<ApiResponse<any[]>> {
    return this.makeRequest(`/admin/chat-management/community-groups/${communityId}`);
  }

  async permanentlyDeleteMessage(messageId: number): Promise<ApiResponse<any>> {
    return this.makeRequest(`/admin/chat-management/permanently-delete-message/${messageId}`, {
      method: 'DELETE'
    });
  }

  async permanentlyDeleteChat(conversationId: number): Promise<ApiResponse<any>> {
    return this.makeRequest(`/admin/chat-management/hard-delete-chat/${conversationId}`, {
      method: 'DELETE'
    });
  }

  async softDeleteConversation(conversationId: number): Promise<ApiResponse<any>> {
    return this.makeRequest(`/admin/chat-management/soft-delete-conversation/${conversationId}`, {
      method: 'DELETE'
    });
  }

  async reviveChat(conversationId: number): Promise<ApiResponse<any>> {
    return this.makeRequest(`/admin/chat-management/revive-chat/${conversationId}`, {
      method: 'POST'
    });
  }

  async promoteToAdmin(conversationId: number, userId: number): Promise<ApiResponse<any>> {
    return this.makeRequest('/chat/promote-to-admin', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        user_id: userId
      })
    });
  }

  async demoteToMember(conversationId: number, userId: number): Promise<ApiResponse<any>> {
    return this.makeRequest('/chat/demote-to-member', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        user_id: userId
      })
    });
  }

  async forceDeclareGroupCreator(conversationId: number, memberId: number): Promise<ApiResponse<any>> {
    return this.makeRequest('/admin/chat-management/force-declare-group-creater', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        member_id: memberId
      })
    });
  }

  // Admin Management APIs
  async getAdmins(): Promise<ApiResponse<AdminUserType[]>> {
    return this.makeRequest<AdminUserType[]>('/admin/admins');
  }

  async createAdmin(email: string, password: string, permissions: string[]): Promise<ApiResponse<AdminUserType>> {
    return this.makeRequest<AdminUserType>('/admin/create-admin', {
      method: 'POST',
      body: JSON.stringify({ email, password, permissions }),
    });
  }

  async updateAdminPermissions(id: number, permissions: string[]): Promise<ApiResponse<AdminUserType>> {
    return this.makeRequest<AdminUserType>('/admin/update-admin-permissions', {
      method: 'PUT',
      body: JSON.stringify({ id, permissions }),
    });
  }

  async updateAdminStatus(id: number, active: boolean): Promise<ApiResponse<AdminUserType>> {
    return this.makeRequest<AdminUserType>('/admin/update-admin-status', {
      method: 'PUT',
      body: JSON.stringify({ id, active }),
    });
  }

  async getUserPermissions(): Promise<ApiResponse<UserPermissions>> {
    return this.makeRequest<UserPermissions>('/admin/user-permissions');
  }

  // Marquee banner (super-admin only). Shown on the app's group-list screen.
  async getMarqueeBanner(): Promise<ApiResponse<MarqueeBanner>> {
    return this.makeRequest<MarqueeBanner>('/admin/marquee-banner');
  }

  async updateMarqueeBanner(text: string, enabled: boolean): Promise<ApiResponse<MarqueeBanner>> {
    return this.makeRequest<MarqueeBanner>('/admin/marquee-banner', {
      method: 'PUT',
      body: JSON.stringify({ text, enabled }),
    });
  }

  // Signup Requests Management APIs
  async getSignupRequests(): Promise<ApiResponse<Array<{
    id: number;
    name: string;
    phone: string;
    status: string;
    rejected_reason: string | null;
    created_at: string;
  }>>> {
    return this.makeRequest('/admin/auth-management/signup-requests');
  }

  async updateUserPhoneNumber(user_id: number, phone: string): Promise<ApiResponse<UserType>> {
    return this.makeRequest<UserType>('/admin/user/update-phone-number', {
      method: 'POST',
      body: JSON.stringify({ user_id, phone }),
    });
  }

  // ── User provisioning + PIN management (super-admin only) ───────────────────
  async createUser(name: string, phone: string, password_pin: string): Promise<ApiResponse<{ id: string; name: string; phone: string; role: string; created_at: string }>> {
    return this.makeRequest('/admin/create-user', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password_pin }),
    });
  }

  async updateUserPasswordPin(user_id: number | string, pin: string): Promise<ApiResponse<{ id: string }>> {
    return this.makeRequest<{ id: string }>('/admin/user/set-password-pin', {
      method: 'POST',
      body: JSON.stringify({ user_id, pin }),
    });
  }

  async updateUserAdminPin(user_id: number | string, pin: string): Promise<ApiResponse<{ id: string }>> {
    return this.makeRequest<{ id: string }>('/admin/user/set-admin-pin', {
      method: 'POST',
      body: JSON.stringify({ user_id, pin }),
    });
  }

  async getPinResetRequests(page: number = 1, limit: number = 20, status?: string): Promise<ApiResponse<PinResetRequestsResponse>> {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.set('status', status);
    return this.makeRequest<PinResetRequestsResponse>(`/admin/pin-reset-requests?${query.toString()}`);
  }

  async resolvePinResetRequest(id: string, status: 'accepted' | 'rejected' = 'rejected'): Promise<ApiResponse<{ id: string }>> {
    return this.makeRequest<{ id: string }>(`/admin/pin-reset-requests/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async updateSignupRequestStatus(data: {
    phone: string;
    name?: string;
    status?: string;
    rejected_reason?: string;
  }): Promise<ApiResponse<{
    id: number;
    name: string;
    phone: string;
    status: string;
    rejected_reason: string | null;
    created_at: string;
  }>> {
    return this.makeRequest('/admin/auth-management/approve-signup-request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin PIN Usage (camouflage / duress) history — super admin only.
  async getAdminPinEvents(page: number = 1, limit: number = 20): Promise<ApiResponse<AdminPinEventsResponse>> {
    return this.makeRequest<AdminPinEventsResponse>(`/admin/admin-pin-events?page=${page}&limit=${limit}`);
  }

  async resolveAdminPinEvent(id: string): Promise<ApiResponse<{ id: string }>> {
    return this.makeRequest<{ id: string }>(`/admin/admin-pin-events/${id}`, {
      method: 'DELETE',
    });
  }

  // Device-change requests — approvable by super-admin and sub-admins.
  async getDeviceChangeRequests(
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<ApiResponse<DeviceChangeRequestsResponse>> {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.set('status', status);
    return this.makeRequest<DeviceChangeRequestsResponse>(
      `/admin/device-change-requests?${query.toString()}`,
    );
  }

  async approveDeviceChangeRequest(id: string): Promise<ApiResponse<{ id: string }>> {
    return this.makeRequest<{ id: string }>(
      `/admin/device-change-requests/${id}/approve`,
      { method: 'POST' },
    );
  }

  async denyDeviceChangeRequest(id: string, reason?: string): Promise<ApiResponse<{ id: string }>> {
    return this.makeRequest<{ id: string }>(
      `/admin/device-change-requests/${id}/deny`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    );
  }

  // Global single-device-lock kill-switch — super-admin only.
  async getSingleDeviceLock(): Promise<ApiResponse<SingleDeviceLock>> {
    return this.makeRequest<SingleDeviceLock>('/admin/single-device-lock');
  }

  async setSingleDeviceLock(enabled: boolean): Promise<ApiResponse<SingleDeviceLock>> {
    return this.makeRequest<SingleDeviceLock>('/admin/single-device-lock', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  }

  // --- Account safety: user reports. Admin, or sub_admin with "manage-chats". ---
  async getReports(page: number = 1, limit: number = 20, status: ReportStatusFilter = 'open'): Promise<ApiResponse<ReportsResponse>> {
    const query = new URLSearchParams({ page: String(page), limit: String(limit), status });
    return this.makeRequest<ReportsResponse>(`/admin/reports?${query.toString()}`);
  }

  async getReport(id: string): Promise<ApiResponse<ReportDetail>> {
    return this.makeRequest<ReportDetail>(`/admin/reports/${encodeURIComponent(id)}`);
  }

  async resolveReport(id: string, status: 'reviewed' | 'dismissed', note?: string): Promise<ApiResponse<{ id: string; status: string; reviewed_at: string }>> {
    const trimmed = note?.trim();
    return this.makeRequest<{ id: string; status: string; reviewed_at: string }>(
      `/admin/reports/${encodeURIComponent(id)}/resolve`,
      { method: 'POST', body: JSON.stringify(trimmed ? { status, note: trimmed } : { status }) },
    );
  }

  // Reversible delete: the account shows as "Deleted account", is signed out
  // and can't log in; all data is kept and a super admin can restore it.
  // Super admin only (backend answers 403 `forbidden` otherwise).
  async adminDeleteAccount(userId: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    return this.makeRequest<{ deleted: boolean; id: string }>(
      `/admin/users/${encodeURIComponent(userId)}/delete-account`,
      { method: 'POST', body: JSON.stringify({}) },
    );
  }

  // --- Deleted accounts: any admin can view, only the super admin restores. ---
  async getDeletedAccounts(page: number = 1, limit: number = 20, search: string = ''): Promise<ApiResponse<DeletedAccountsResponse>> {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    const q = search.trim();
    if (q) query.set('search', q);
    return this.makeRequest<DeletedAccountsResponse>(`/admin/deleted-accounts?${query.toString()}`);
  }

  async getDeletedAccount(userId: string): Promise<ApiResponse<DeletedAccountDetail>> {
    return this.makeRequest<DeletedAccountDetail>(`/admin/deleted-accounts/${encodeURIComponent(userId)}`);
  }

  async restoreAccount(userId: string): Promise<ApiResponse<{ restored: boolean }>> {
    return this.makeRequest<{ restored: boolean }>(
      `/admin/users/${encodeURIComponent(userId)}/restore`,
      { method: 'POST', body: JSON.stringify({}) },
    );
  }

  // --- Account recovery requests (super admin only). ---
  async getRecoveryRequests(status: RecoveryRequestStatus = 'pending', page: number = 1, limit: number = 20): Promise<ApiResponse<RecoveryRequestsResponse>> {
    const query = new URLSearchParams({ status, page: String(page), limit: String(limit) });
    return this.makeRequest<RecoveryRequestsResponse>(`/admin/recovery-requests?${query.toString()}`);
  }

  async restoreRecoveryRequest(id: string): Promise<ApiResponse<{ restored: boolean }>> {
    return this.makeRequest<{ restored: boolean }>(
      `/admin/recovery-requests/${encodeURIComponent(id)}/restore`,
      { method: 'POST', body: JSON.stringify({}) },
    );
  }

  async dismissRecoveryRequest(id: string): Promise<ApiResponse<unknown>> {
    return this.makeRequest<unknown>(
      `/admin/recovery-requests/${encodeURIComponent(id)}/dismiss`,
      { method: 'POST', body: JSON.stringify({}) },
    );
  }

}

export { type UserType, type AdminUserType, type UserPermissions, type MarqueeBanner, type PaginatedUsersResponse, type DashboardStats, type Community, type CommunityMember, type CommunityGroup, type StandaloneGroup, type AdminPinEvent, type AdminPinEventsResponse, type DeviceChangeRequest, type DeviceChangeRequestsResponse, type SingleDeviceLock, type PinResetRequest, type PinResetRequestsResponse, type ReportTargetType, type ReportReason, type ReportStatus, type ReportStatusFilter, type ReportPersonRef, type ReportChatRef, type ReportListItem, type ReportEvidence, type ReportEvidenceMessage, type ReportDetail, type ReportsResponse, type AccountDeletedBy, type DeletedAccount, type DeletedAccountGroup, type DeletedAccountDetail, type DeletedAccountsResponse, type RecoveryRequestStatus, type RecoveryRequest, type RecoveryRequestsResponse };
export { apiErrorCode };

export const api_client = new ApiClient();
