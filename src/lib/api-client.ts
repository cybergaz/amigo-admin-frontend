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
      console.log(`🚀 API Request: ${options.method || "GET"} -> ${url}`, { body: options.body ? JSON.parse(options.body as string) : undefined, headers: defaultOptions.headers, });

      const response = await fetch(url, defaultOptions);
      const data = await response.json();

      console.log(`📥 API Response: ${options.method || "GET"} -> ${url}`, { api_res_status: response.status, data, });

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

  async deleteUser(id: number): Promise<ApiResponse<{ id: number; name: string }>> {
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
    group: any;
    members: any[];
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

}

export { type UserType, type AdminUserType, type UserPermissions, type PaginatedUsersResponse, type DashboardStats, type Community, type CommunityMember, type CommunityGroup, type StandaloneGroup };

export const api_client = new ApiClient();
