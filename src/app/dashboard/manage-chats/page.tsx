
"use client";

import { useState, useEffect } from "react";
import { api_client } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/animated-shadcn-tabs";
import {
  Users,
  MessageCircle,
  Hash,
  Target,
  Eye,
  MessageSquare,
  UserPlus,
  UserMinus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  RefreshCw
} from "lucide-react";
import { MemberManagementDialog } from "@/components/chat-management/MemberManagementDialog";
import { MessageViewerDialog } from "@/components/chat-management/MessageViewerDialog";
import { ChatViewerDialog, type ChatViewerDialogProps } from "@/components/chat-management/ChatViewerDialog";
import { GroupMemberManagementDialog } from "@/components/chat-management/GroupMemberManagementDialog";
import BouncingBalls from "@/components/ui/bouncing-balls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ChatStats {
  totalGroups: number;
  adminManagedGroups: number;
  userCreatedGroups: number;
  totalInnerGroups: number;
  totalDirectChats: number;
  totalMembers: number;
}

interface ChatGroup {
  conversationId: number;
  type: string;
  title: string;
  metadata?: any;
  lastMessageAt?: string;
  role: string;
  unreadCount: number;
  joinedAt: string;
  userId?: number;
  userName?: string;
  lastSeen?: string;
  userProfilePic?: string;
  createrId?: number;
  createrName?: string;
  createrProfilePic?: string;
  memberCount?: number;
}

interface DirectChat {
  conversationId: number;
  type: string;
  lastMessageAt?: string;
  participant1?: {
    userId: number;
    userName: string;
    userProfilePic?: string;
    userEmail?: string;
  } | null;
  participant2?: {
    userId: number;
    userName: string;
    userProfilePic?: string;
    userEmail?: string;
  } | null;
}

interface Community {
  id: number;
  name: string;
  description?: string;
  super_admin_id: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
  user_role: string;
}

export default function ManageChats() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [adminGroups, setAdminGroups] = useState<ChatGroup[]>([]);
  const [userGroups, setUserGroups] = useState<ChatGroup[]>([]);
  const [communityGroups, setCommunityGroups] = useState<ChatGroup[]>([]);
  const [directChats, setDirectChats] = useState<DirectChat[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("user-groups");
  const [groupMembers, setGroupMembers] = useState<{ [key: number]: any[] }>({});

  // Pagination state for direct chats
  const [dmPage, setDmPage] = useState(1);
  const [dmLimit] = useState(20);
  const [dmPagination, setDmPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null>(null);

  // Search and delete dialog state
  const [dmSearchQuery, setDmSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null);
  const [dmLoading, setDmLoading] = useState(false);

  // Pagination state for user groups
  const [userGroupsPage, setUserGroupsPage] = useState(1);
  const [userGroupsLimit] = useState(20);
  const [userGroupsPagination, setUserGroupsPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null>(null);
  const [userGroupsSearchQuery, setUserGroupsSearchQuery] = useState("");
  const [debouncedUserGroupsSearch, setDebouncedUserGroupsSearch] = useState("");
  const [userGroupsShowDeleted, setUserGroupsShowDeleted] = useState(false);
  const [userGroupsLoading, setUserGroupsLoading] = useState(false);

  // Pagination state for community groups
  const [communityGroupsPage, setCommunityGroupsPage] = useState(1);
  const [communityGroupsLimit] = useState(20);
  const [communityGroupsPagination, setCommunityGroupsPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null>(null);
  const [communityGroupsSearchQuery, setCommunityGroupsSearchQuery] = useState("");
  const [debouncedCommunityGroupsSearch, setDebouncedCommunityGroupsSearch] = useState("");
  const [communityGroupsShowDeleted, setCommunityGroupsShowDeleted] = useState(false);
  const [communityGroupsLoading, setCommunityGroupsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Debounced search effect for DM - only updates the debounced value after user stops typing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(dmSearchQuery);
      setDmPage(1); // Reset to page 1 when search changes
    }, 700);

    return () => clearTimeout(debounceTimer);
  }, [dmSearchQuery]);

  // Debounced search effect for user groups
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedUserGroupsSearch(userGroupsSearchQuery);
      setUserGroupsPage(1); // Reset to page 1 when search changes
    }, 700);

    return () => clearTimeout(debounceTimer);
  }, [userGroupsSearchQuery]);

  // Debounced search effect for community groups
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedCommunityGroupsSearch(communityGroupsSearchQuery);
      setCommunityGroupsPage(1); // Reset to page 1 when search changes
    }, 700);

    return () => clearTimeout(debounceTimer);
  }, [communityGroupsSearchQuery]);

  // Load direct chats when page or debounced search changes
  useEffect(() => {
    loadDirectChats();
  }, [dmPage, debouncedSearchQuery]);

  // Load user groups when page, search, or filter changes
  useEffect(() => {
    loadUserGroups();
  }, [userGroupsPage, debouncedUserGroupsSearch, userGroupsShowDeleted]);

  // Load community groups when page, search, or filter changes
  useEffect(() => {
    loadCommunityGroups();
  }, [communityGroupsPage, debouncedCommunityGroupsSearch, communityGroupsShowDeleted]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load stats
      const statsResponse = await api_client.getChatManagementStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Load communities
      const communitiesResponse = await api_client.getChatManagementCommunities();
      if (communitiesResponse.success && communitiesResponse.data) {
        setCommunities(communitiesResponse.data);
      }

    } catch (error) {
      console.error("Error loading chat management data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserGroups = async () => {
    try {
      setUserGroupsLoading(true);
      const response = await api_client.getChatManagementGroups(
        "group",
        userGroupsPage,
        userGroupsLimit,
        debouncedUserGroupsSearch,
        userGroupsShowDeleted
      );

      if (response.success && response.data) {
        setUserGroups(response.data.groups);
        setUserGroupsPagination(response.data.pagination);

        // Load members for each group
        for (const group of response.data.groups) {
          try {
            const membersResponse = await api_client.getChatManagementGroupDetails(group.conversationId);
            if (membersResponse.success && membersResponse.data) {
              // Ensure we're setting an array of members
              const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
              setGroupMembers(prev => ({
                ...prev,
                [group.conversationId]: members
              }));
            }
          } catch (error) {
            console.error(`Error loading members for group ${group.conversationId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error loading user groups:", error);
      toast.error("Failed to load user groups");
    } finally {
      setUserGroupsLoading(false);
    }
  };

  const loadCommunityGroups = async () => {
    try {
      setCommunityGroupsLoading(true);
      const response = await api_client.getChatManagementGroups(
        "community_group",
        communityGroupsPage,
        communityGroupsLimit,
        debouncedCommunityGroupsSearch,
        communityGroupsShowDeleted
      );

      if (response.success && response.data) {
        setCommunityGroups(response.data.groups);
        setCommunityGroupsPagination(response.data.pagination);

        // Load members for each community group
        for (const group of response.data.groups) {
          try {
            const membersResponse = await api_client.getChatManagementGroupDetails(group.conversationId);
            if (membersResponse.success && membersResponse.data) {
              // Ensure we're setting an array of members
              const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
              setGroupMembers(prev => ({
                ...prev,
                [group.conversationId]: members
              }));
            }
          } catch (error) {
            console.error(`Error loading members for community group ${group.conversationId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error loading community groups:", error);
      toast.error("Failed to load community groups");
    } finally {
      setCommunityGroupsLoading(false);
    }
  };

  const loadDirectChats = async () => {
    try {
      setDmLoading(true);
      const directChatsResponse = await api_client.getChatManagementDirectChats(dmPage, dmLimit, debouncedSearchQuery);
      if (directChatsResponse.success && directChatsResponse.data) {
        setDirectChats(directChatsResponse.data.chats);
        setDmPagination(directChatsResponse.data.pagination);
      }
    } catch (error) {
      console.error("Error loading direct chats:", error);
      toast.error("Failed to load direct chats");
    } finally {
      setDmLoading(false);
    }
  };

  const handleMembersUpdated = async (conversationId: number) => {
    // Reload group details to get updated members
    try {
      const membersResponse = await api_client.getChatManagementGroupDetails(conversationId);
      if (membersResponse.success && membersResponse.data) {
        // Ensure we're setting an array of members
        const members = Array.isArray(membersResponse.data) ? membersResponse.data : [];
        setGroupMembers(prev => ({
          ...prev,
          [conversationId]: members
        }));
      }
    } catch (error) {
      console.error("Error reloading group members:", error);
    }
  };

  const handleDeleteChat = (conversationId: number, type: 'dm' | 'group' | 'community_group') => {
    setConversationToDelete(conversationId);
    setActiveTab(type === 'dm' ? 'direct-chats' : type === 'group' ? 'user-groups' : 'community-groups');
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteDialogOpen(false);
    if (!conversationToDelete) return;

    try {
      let response;
      response = await api_client.permanentlyDeleteChat(conversationToDelete);

      if (response.success) {
        const entityType = activeTab === 'direct-chats' ? 'Direct conversation' : 'Group';
        toast.success(`${entityType} deleted successfully`);

        // Reload the appropriate list
        if (activeTab === 'direct-chats') {
          await loadDirectChats();
        } else if (activeTab === 'user-groups') {
          await loadUserGroups();
        } else if (activeTab === 'community-groups') {
          await loadCommunityGroups();
        }

        setConversationToDelete(null);
      } else {
        toast.error(response.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDmSearchQuery(e.target.value);
  };

  const handleReviveChat = async (conversationId: number, type: 'dm' | 'group' | 'community_group') => {
    try {
      const response = await api_client.reviveChat(conversationId);
      
      if (response.success) {
        const entityType = type === 'dm' ? 'Direct conversation' : 'Group';
        toast.success(`${entityType} revived successfully`);
        
        // Reload the appropriate list
        if (type === 'dm' || activeTab === 'direct-chats') {
          await loadDirectChats();
        } else if (type === 'group' || activeTab === 'user-groups') {
          await loadUserGroups();
        } else if (type === 'community_group' || activeTab === 'community-groups') {
          await loadCommunityGroups();
        }
      } else {
        toast.error(response.message || 'Failed to revive conversation');
      }
    } catch (error) {
      console.error("Error reviving conversation:", error);
      toast.error("Failed to revive conversation");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center flex flex-col gap-2 justify-center items-center">
          <BouncingBalls balls={4} className=" fill-black stroke-black" animation="animate-bounce-md" />
          It is going to take a few extra seconds as we are loading heavy data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Groups</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.totalGroups}</p>
                    <p className="text-xs text-blue-600">
                      {stats.adminManagedGroups} Admin Managed • {stats.userCreatedGroups} User Created
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Community Groups</p>
                    <p className="text-3xl font-bold text-green-900">{stats.totalInnerGroups}</p>
                    <p className="text-xs text-green-600">Admin Created</p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Direct Chats</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.totalDirectChats}</p>
                    <p className="text-xs text-purple-600">User Conversations</p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-lg">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Total Members</p>
                    <p className="text-3xl font-bold text-yellow-900">{stats.totalMembers}</p>
                    <p className="text-xs text-yellow-600">Across All Groups</p>
                  </div>
                  <div className="p-3 bg-yellow-500 rounded-lg">
                    <Hash className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Chat Management</h1>
              <p className="text-muted-foreground">Manage all groups, inner groups, and direct conversations</p>
            </div>
            <TabsList className="flex">
              {/* <TabsTrigger value="overview">Overview</TabsTrigger> */}
              <TabsTrigger value="user-groups">User Groups</TabsTrigger>
              <TabsTrigger value="community-groups">Community Groups</TabsTrigger>
              <TabsTrigger value="direct-chats">Direct Chats</TabsTrigger>
            </TabsList>
          </div>


          {/* User Groups Tab */}
          <TabsContent value="user-groups" className="space-y-6">
            <GroupsTable
              groups={userGroups}
              groupMembers={groupMembers}
              onDelete={(id) => handleDeleteChat(id, 'group')}
              onRevive={(id) => handleReviveChat(id, 'group')}
              onMembersUpdated={handleMembersUpdated}
              pagination={userGroupsPagination}
              onPageChange={setUserGroupsPage}
              searchQuery={userGroupsSearchQuery}
              onSearchChange={(e) => setUserGroupsSearchQuery(e.target.value)}
              loading={userGroupsLoading}
              showDeleted={userGroupsShowDeleted}
              onShowDeletedChange={setUserGroupsShowDeleted}
              title="User Groups"
              description="User Created Groups • Manage groups created by users"
            />
          </TabsContent>

          {/* Community Groups Tab */}
          <TabsContent value="community-groups" className="space-y-6">
            <GroupsTable
              groups={communityGroups}
              groupMembers={groupMembers}
              onDelete={(id) => handleDeleteChat(id, 'community_group')}
              onRevive={(id) => handleReviveChat(id, 'community_group')}
              onMembersUpdated={handleMembersUpdated}
              pagination={communityGroupsPagination}
              onPageChange={setCommunityGroupsPage}
              searchQuery={communityGroupsSearchQuery}
              onSearchChange={(e) => setCommunityGroupsSearchQuery(e.target.value)}
              loading={communityGroupsLoading}
              showDeleted={communityGroupsShowDeleted}
              onShowDeletedChange={setCommunityGroupsShowDeleted}
              title="Community Groups"
              description="Community Groups • Admin managed community groups"
            />
          </TabsContent>

          {/* Direct Chats Tab */}
          <TabsContent value="direct-chats" className="space-y-6">
            <DirectChatsTable
              chats={directChats}
              onDelete={(id) => handleDeleteChat(id, 'dm')}
              pagination={dmPagination}
              onPageChange={setDmPage}
              searchQuery={dmSearchQuery}
              onSearchChange={handleSearchChange}
              loading={dmLoading}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                <span>PERMANENT DELETE WARNING</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Extreme Warning Section */}
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                <h3 className="font-bold text-red-700 mb-2 text-lg">⚠️ CRITICAL ACTION</h3>
                <p className="text-red-700 font-semibold mb-2">
                  This action is PERMANENT and IRREVERSIBLE!
                </p>
                <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                  <li>Chat will be completely removed from the DATABASE</li>
                  <li>All chat data will be permanently deleted</li>
                  <li>No recovery after this point</li>
                </ul>
              </div>

              {/* User Info Section */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-3">Conversation to be deleted:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">ID:</span>
                    <span className="font-bold">{conversationToDelete}</span>
                  </div>
                </div>
              </div>

              {/* Final Warning */}
              {/* <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-3"> */}
              {/*   <p className="text-yellow-800 text-sm font-medium text-center"> */}
              {/*     🛑 Please confirm you understand this action is permanent and cannot be reversed */}
              {/*   </p> */}
              {/* </div> */}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel (Safe Option)
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 font-bold"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Yes, Permanently Delete Chat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

// Groups Table Component
function GroupsTable({
  groups,
  groupMembers,
  onDelete,
  onRevive,
  onMembersUpdated,
  pagination,
  onPageChange,
  searchQuery,
  onSearchChange,
  loading,
  showDeleted,
  onShowDeletedChange,
  title,
  description
}: {
  groups: ChatGroup[];
  groupMembers: { [key: number]: any[] };
  onDelete: (id: number) => void;
  onRevive: (id: number) => void;
  onMembersUpdated: (conversationId: number) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
  title: string;
  description: string;
}) {
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedGroupTitle, setSelectedGroupTitle] = useState<string>("");

  const handleManageMembers = (conversationId: number, groupTitle: string) => {
    setSelectedGroupId(conversationId);
    setSelectedGroupTitle(groupTitle);
    setManageDialogOpen(true);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {description}
              {pagination && ` • Showing ${groups.length} of ${pagination.totalCount} groups`}
            </p>
          </div>
        </div>

        {/* Search Bar and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by group title, ID, or creator..."
              value={searchQuery}
              onChange={onSearchChange}
              className="pl-10 max-w-md pr-10"
              disabled={loading}
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
          <Button
            variant={showDeleted ? "default" : "outline"}
            onClick={() => onShowDeletedChange(!showDeleted)}
            disabled={loading}
          >
            {showDeleted ? "Hide Deleted" : "Show Deleted"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">GROUP ID</TableHead>
                <TableHead className="w-[250px]">GROUP TITLE</TableHead>
                <TableHead className="w-[150px]">NO. OF MEMBERS</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading groups...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No groups found matching your search" : "No groups found"}
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => {
                  const members = groupMembers[group.conversationId] || [];
                  const isDeleted = showDeleted; // If showDeleted is true, all groups in the list are deleted
                  return (
                    <TableRow key={group.conversationId}>
                      <TableCell className="font-medium">#{group.conversationId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{group.title || "Untitled Group"}</p>
                          <p className="text-xs text-muted-foreground">
                            Created by: {group.createrName || `ID: ${group.createrId || "N/A"}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{members.length} members</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {/* Desktop: Full buttons with text */}
                          <div className="hidden md:flex gap-2">
                            <ChatViewerDialog
                              conversationId={group.conversationId}
                              conversationTitle={group.title || "Untitled Group"}
                              conversationType={title.includes("Community") ? "community_group" : "group"}
                              members={members}
                            />
                            <MessageViewerDialog
                              conversationId={group.conversationId}
                              conversationTitle={group.title || "Untitled Group"}
                              conversationType={title.includes("Community") ? "community_group" : "group"}
                            />
                            {!isDeleted && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleManageMembers(group.conversationId, group.title || "Untitled Group")}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Manage
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onDelete(group.conversationId)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </>
                            )}
                            {isDeleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRevive(group.conversationId)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Revive
                              </Button>
                            )}
                          </div>

                          {/* Mobile: Icon-only buttons */}
                          <div className="flex md:hidden gap-1">
                            <ChatViewerDialog
                              conversationId={group.conversationId}
                              conversationTitle={group.title || "Untitled Group"}
                              conversationType={title.includes("Community") ? "community_group" : "group"}
                              members={members}
                              iconOnly
                            />
                            <MessageViewerDialog
                              conversationId={group.conversationId}
                              conversationTitle={group.title || "Untitled Group"}
                              conversationType={title.includes("Community") ? "community_group" : "group"}
                              iconOnly
                            />
                            {!isDeleted && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleManageMembers(group.conversationId, group.title || "Untitled Group")}
                                  className="px-2"
                                >
                                  <UserPlus className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onDelete(group.conversationId)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {isDeleted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRevive(group.conversationId)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 px-2"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage || loading}
                >
                  {loading && pagination.currentPage > 1 ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 mr-1" />
                  )}
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  {loading ? (
                    <>
                      Next
                      <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Member Management Dialog */}
      {selectedGroupId && (
        <GroupMemberManagementDialog
          isOpen={manageDialogOpen}
          onClose={() => {
            setManageDialogOpen(false);
            setSelectedGroupId(null);
            setSelectedGroupTitle("");
          }}
          conversationId={selectedGroupId}
          groupTitle={selectedGroupTitle}
          onSave={() => onMembersUpdated(selectedGroupId)}
        />
      )}
    </div>
  );
}

// Direct Chats Table Component
function DirectChatsTable({
  chats,
  onDelete,
  pagination,
  onPageChange,
  searchQuery,
  onSearchChange,
  loading
}: {
  chats: DirectChat[];
  onDelete: (id: number) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}) {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Direct Conversations</h2>
            <p className="text-sm text-muted-foreground">
              User-to-User Chats • Monitor direct conversations between users
              {pagination && ` • Showing ${chats.length} of ${pagination.totalCount} chats`}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, phone number, or user ID..."
            value={searchQuery}
            onChange={onSearchChange}
            className="pl-10 max-w-md pr-10"
            disabled={loading}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">PARTICIPANT 1 (Creator)</TableHead>
                <TableHead className="w-[250px]">PARTICIPANT 2</TableHead>
                <TableHead>LAST ACTIVITY</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading direct conversations...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : chats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No conversations found matching your search" : "No direct conversations found"}
                  </TableCell>
                </TableRow>
              ) : (
                chats.map((chat) => (
                  <TableRow key={chat.conversationId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {chat.participant1?.userName?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{chat.participant1?.userName || "Unknown User"}</p>
                          <p className="text-xs text-muted-foreground">
                            {chat.participant1?.userEmail || `ID: ${chat.participant1?.userId || "N/A"}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {chat.participant2?.userName?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{chat.participant2?.userName || "Unknown User"}</p>
                          <p className="text-xs text-muted-foreground">
                            {chat.participant2?.userEmail || `ID: ${chat.participant2?.userId || "N/A"}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground">
                        {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : "No activity"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <MessageViewerDialog
                          conversationId={chat.conversationId}
                          conversationTitle={`${chat.participant1?.userName || 'User'} & ${chat.participant2?.userName || 'User'}`}
                          conversationType="dm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(chat.conversationId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage || loading}
                >
                  {loading && pagination.currentPage > 1 ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ChevronLeft className="h-4 w-4 mr-1" />
                  )}
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  {loading ? (
                    <>
                      Next
                      <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
