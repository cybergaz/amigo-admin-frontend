
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
  Archive,
  Trash2,
  Camera,
  FileText
} from "lucide-react";
import { MemberManagementDialog } from "@/components/chat-management/MemberManagementDialog";
import { MessageViewerDialog } from "@/components/chat-management/MessageViewerDialog";
import { ChatViewerDialog } from "@/components/chat-management/ChatViewerDialog";
import BouncingBalls from "@/components/ui/bouncing-balls";

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
  title?: string;
  lastMessageAt?: string;
  role: string;
  unreadCount: number;
  joinedAt: string;
  userId: number;
  userName: string;
  lastSeen?: string;
  userProfilePic?: string;
  createrId?: number;
  createrName?: string;
  createrProfilePic?: string;
  memberCount?: number;
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
  const [directChats, setDirectChats] = useState<DirectChat[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [groupMembers, setGroupMembers] = useState<{ [key: number]: any[] }>({});

  useEffect(() => {
    loadData();
  }, []);

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

      // Load direct chats
      const directChatsResponse = await api_client.getChatManagementDirectChats(1, 50);
      if (directChatsResponse.success && directChatsResponse.data) {
        setDirectChats(directChatsResponse.data.chats);
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

  const handleViewChat = (conversationId: number) => {
    // Navigate to chat view
    console.log("View chat:", conversationId);
  };

  const handleViewMessages = (conversationId: number) => {
    // Navigate to messages view
    console.log("View messages:", conversationId);
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

  const handleArchiveChat = (conversationId: number) => {
    // Archive chat
    console.log("Archive chat:", conversationId);
  };

  const handleDeleteChat = (conversationId: number) => {
    // Delete chat
    console.log("Delete chat:", conversationId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BouncingBalls balls={4} className=" fill-black stroke-black" animation="animate-bounce-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Chat Management</h1>
          <p className="text-muted-foreground">Manage all groups, inner groups, and direct conversations</p>
        </div>

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
                    <p className="text-sm font-medium text-green-700">Total Inner Groups</p>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="admin-groups">Admin Groups</TabsTrigger>
            <TabsTrigger value="user-groups">User Groups</TabsTrigger>
            <TabsTrigger value="direct-chats">Direct Chats</TabsTrigger>
          </TabsList>

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

          {/* Direct Chats Tab */}
          <TabsContent value="direct-chats" className="space-y-6">
            <DirectChatsTable
              chats={directChats}
              onViewChat={handleViewChat}
              onViewMessages={handleViewMessages}
              onArchive={handleArchiveChat}
              onDelete={handleDeleteChat}
            />
          </TabsContent>
        </Tabs>
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
          />
          <MessageViewerDialog
            conversationId={group.conversationId}
            conversationTitle={group.title || "Untitled Group"}
            conversationType="group"
          />
        </div>

        <div className="flex gap-2">
          <MemberManagementDialog
            conversationId={group.conversationId}
            groupTitle={group.title || "Untitled Group"}
            currentMembers={members}
            onMembersUpdated={onMembersUpdated}
            mode="add"
          />
          <MemberManagementDialog
            conversationId={group.conversationId}
            groupTitle={group.title || "Untitled Group"}
            currentMembers={members}
            onMembersUpdated={onMembersUpdated}
            mode="remove"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Direct Chats Table Component
function DirectChatsTable({
  chats,
  onViewChat,
  onViewMessages,
  onArchive,
  onDelete
}: {
  chats: DirectChat[];
  onViewChat: (id: number) => void;
  onViewMessages: (id: number) => void;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Direct Conversations</h2>
        <p className="text-sm text-muted-foreground">
          User-to-User Chats • Monitor direct conversations between users • Showing {chats.length} chats
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">PARTICIPANTS</th>
                  <th className="p-4 font-medium">LAST MESSAGE</th>
                  <th className="p-4 font-medium">TYPE</th>
                  <th className="p-4 font-medium">LAST ACTIVITY</th>
                  <th className="p-4 font-medium">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((chat) => (
                  <tr key={chat.conversationId} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {chat.createrName?.charAt(0) || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">Direct Chat</p>
                          <p className="text-xs text-muted-foreground">2 participants</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">Hello</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <FileText className="h-3 w-3 mr-1" />
                        text
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-muted-foreground">
                        {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : "No activity"}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <ChatViewerDialog
                          conversationId={chat.conversationId}
                          conversationTitle="Direct Chat"
                          conversationType="dm"
                        />
                        <MessageViewerDialog
                          conversationId={chat.conversationId}
                          conversationTitle="Direct Chat"
                          conversationType="dm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onArchive(chat.conversationId)}
                        >
                          <Archive className="h-3 w-3 mr-1" />
                          Archive
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDelete(chat.conversationId)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
