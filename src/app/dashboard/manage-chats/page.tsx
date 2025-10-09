
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
  Loader2
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

  useEffect(() => {
    loadData();
  }, []);

  // Debounced search effect - only updates the debounced value after user stops typing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(dmSearchQuery);
      setDmPage(1); // Reset to page 1 when search changes
    }, 700); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [dmSearchQuery]);

  // Load direct chats when page or debounced search changes
  useEffect(() => {
    loadDirectChats();
  }, [dmPage, debouncedSearchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load stats
      const statsResponse = await api_client.getChatManagementStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Load all groups
      const groupsResponse = await api_client.getChatManagementGroups("group");
      if (groupsResponse.success && groupsResponse.data) {
        const groups = groupsResponse.data;
        // Filter groups based on creator - admin created vs user created
        const adminGroupsData = groups.filter((group: any) =>
          group.createrId === 1 // Assuming admin user ID is 1 - you might need to get this from auth
        );
        const userGroupsData = groups.filter((group: any) =>
          group.createrId !== 1
        );

        setAdminGroups(adminGroupsData);
        setUserGroups(userGroupsData);

        // Load members for each group
        for (const group of [...adminGroupsData, ...userGroupsData]) {
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

      // Load community groups
      const communityGroupsResponse = await api_client.getChatManagementGroups("community_group");
      if (communityGroupsResponse.success && communityGroupsResponse.data) {
        const commGroups = communityGroupsResponse.data;
        setCommunityGroups(commGroups);

        // Load members for each community group
        for (const group of commGroups) {
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

      // Load direct chats will be handled separately in loadDirectChats

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

  const handleDeleteChat = (conversationId: number) => {
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      const response = await api_client.softDeleteDm(conversationToDelete);
      if (response.success) {
        toast.success("Direct conversation deleted successfully");
        await loadDirectChats();
        setDeleteDialogOpen(false);
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

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Admin Managed Groups */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h2 className="text-xl font-semibold">Groups & Inner Groups</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">• Admin Managed Groups</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {adminGroups.map((group) => (
                  <AdminGroupCard
                    key={group.conversationId}
                    group={group}
                    members={groupMembers[group.conversationId] || []}
                    onMembersUpdated={() => handleMembersUpdated(group.conversationId)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Admin Groups Tab */}
          <TabsContent value="admin-groups" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {adminGroups.map((group) => (
                <AdminGroupCard
                  key={group.conversationId}
                  group={group}
                  members={groupMembers[group.conversationId] || []}
                  onMembersUpdated={() => handleMembersUpdated(group.conversationId)}
                />
              ))}
            </div>
          </TabsContent>

          {/* User Groups Tab */}
          <TabsContent value="user-groups" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {userGroups.map((group) => (
                <UserGroupCard
                  key={group.conversationId}
                  group={group}
                  members={groupMembers[group.conversationId] || []}
                  onMembersUpdated={() => handleMembersUpdated(group.conversationId)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Community Groups Tab */}
          <TabsContent value="community-groups" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {communityGroups.map((group) => (
                <CommunityGroupCard
                  key={group.conversationId}
                  group={group}
                  members={groupMembers[group.conversationId] || []}
                  onMembersUpdated={() => handleMembersUpdated(group.conversationId)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Direct Chats Tab */}
          <TabsContent value="direct-chats" className="space-y-6">
            <DirectChatsTable
              chats={directChats}
              onDelete={handleDeleteChat}
              pagination={dmPagination}
              onPageChange={setDmPage}
              searchQuery={dmSearchQuery}
              onSearchChange={handleSearchChange}
              loading={dmLoading}
            />
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Direct Conversation</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this direct conversation? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setConversationToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Admin Group Card Component
function AdminGroupCard({
  group,
  members,
  onMembersUpdated
}: {
  group: ChatGroup;
  members: any[];
  onMembersUpdated: () => void;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">A</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{group.title || "Untitled Group"}</h3>
            <p className="text-sm text-muted-foreground">No description</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">Admin Managed</Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="px-3 py-1 bg-blue-50 rounded-lg">
            <span className="text-blue-700 text-sm font-medium">0 Inner Groups</span>
          </div>
          <div className="px-3 py-1 bg-green-50 rounded-lg">
            <span className="text-green-700 text-sm font-medium">{members.length} Members</span>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Inner Groups</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Sample Inner Group</p>
                <p className="text-xs text-muted-foreground">1:00 PM - 3:00 PM • 2 members</p>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">Inner Group</Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <ChatViewerDialog
            conversationId={group.conversationId}
            conversationTitle={group.title || "Untitled Group"}
            conversationType="group"
          />
          <MessageViewerDialog
            conversationId={group.conversationId}
            conversationTitle={group.title || "Untitled Group"}
            conversationType="group"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// User Group Card Component
function UserGroupCard({
  group,
  members,
  onMembersUpdated
}: {
  group: ChatGroup;
  members: any[];
  onMembersUpdated: () => void;
}) {
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">U</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{group.title || "Untitled Group"}</h3>
            <p className="text-sm text-muted-foreground">User created group</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-700">User Group</Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="px-3 py-1 bg-green-50 rounded-lg">
            <span className="text-green-700 text-sm font-medium">0 Inner Groups</span>
          </div>
          <div className="px-3 py-1 bg-blue-50 rounded-lg">
            <span className="text-blue-700 text-sm font-medium">{members.length} Members</span>
          </div>
        </div>

        <div className="flex gap-2">
          <ChatViewerDialog
            conversationId={group.conversationId}
            conversationTitle={group.title || "Untitled Group"}
            conversationType="group"
            members={members}
          />
          <MessageViewerDialog
            conversationId={group.conversationId}
            conversationTitle={group.title || "Untitled Group"}
            conversationType="group"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setManageDialogOpen(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Members
          </Button>
        </div>

        <GroupMemberManagementDialog
          isOpen={manageDialogOpen}
          onClose={() => setManageDialogOpen(false)}
          conversationId={group.conversationId}
          groupTitle={group.title || "Untitled Group"}
          onSave={onMembersUpdated}
        />
      </CardContent>
    </Card>
  );
}

// Community Group Card Component
function CommunityGroupCard({
  group,
  members,
  onMembersUpdated
}: {
  group: ChatGroup;
  members: any[];
  onMembersUpdated: () => void;
}) {
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">C</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{group.title || "Untitled Group"}</h3>
            <p className="text-sm text-muted-foreground">Community group</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">Community Group</Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="px-3 py-1 bg-purple-50 rounded-lg">
            <span className="text-purple-700 text-sm font-medium">{members.length} Members</span>
          </div>
          <div className="px-3 py-1 bg-blue-50 rounded-lg">
            <span className="text-blue-700 text-sm font-medium">Community</span>
          </div>
        </div>

        <div className="flex gap-2">
          <ChatViewerDialog
            conversationId={group.conversationId}
            conversationTitle={group.title || "Untitled Group"}
            conversationType="community_group"
            members={members}
          />
          <MessageViewerDialog
            conversationId={group.conversationId}
            conversationTitle={group.title || "Untitled Group"}
            conversationType="community_group"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setManageDialogOpen(true)}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Members
          </Button>
        </div>

        <GroupMemberManagementDialog
          isOpen={manageDialogOpen}
          onClose={() => setManageDialogOpen(false)}
          conversationId={group.conversationId}
          groupTitle={group.title || "Untitled Group"}
          onSave={onMembersUpdated}
        />
      </CardContent>
    </Card>
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
