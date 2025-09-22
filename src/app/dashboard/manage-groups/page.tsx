
'use client';

import React, { useState, useEffect } from 'react';
import { api_client, type Community, type CommunityGroup, type StandaloneGroup, type UserType } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/animated-shadcn-tabs';
import { toast } from 'sonner';
import CommunityEditDialog from '@/components/community-management/CommunityEditDialog';
import GroupEditDialog from '@/components/group-management/GroupEditDialog';
import GroupEditDetailsDialog from '@/components/group-management/GroupEditDetailsDialog';
import BouncingBalls from '@/components/ui/bouncing-balls';

interface CommunityWithGroups extends Community {
  groups?: CommunityGroup[];
}

export default function ManageGroups() {
  const [activeTab, setActiveTab] = useState("communities");
  const [communities, setCommunities] = useState<CommunityWithGroups[]>([]);
  const [standaloneGroups, setStandaloneGroups] = useState<StandaloneGroup[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditCommunity, setShowEditCommunity] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showEditGroupDetails, setShowEditGroupDetails] = useState(false);
  const [showEditGroupMembers, setShowEditGroupMembers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Selected items
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityWithGroups | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | StandaloneGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'community' | 'group', id: number, name: string } | null>(null);

  // Form states
  const [communityName, setCommunityName] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [groupStartTime, setGroupStartTime] = useState('13:00');
  const [groupEndTime, setGroupEndTime] = useState('15:00');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [communitiesRes, groupsRes, usersRes] = await Promise.all([
        api_client.getCommunities(),
        api_client.getChatList('group'),
        api_client.getUsers(1, 1000) // Get all users for member selection
      ]);

      if (communitiesRes.success && communitiesRes.data) {
        // Fetch groups for each community
        const communitiesWithDetails = await Promise.all(
          communitiesRes.data.map(async (community) => {
            const groupsRes = await api_client.getCommunityGroups(community.id);

            return {
              ...community,
              groups: groupsRes.success && groupsRes.data ? groupsRes.data : []
            };
          })
        );
        setCommunities(communitiesWithDetails);
      }

      if (groupsRes.success && groupsRes.data) {
        // Fetch member details for standalone groups
        const groupsWithMembers = await Promise.all(
          groupsRes.data.map(async (group) => {
            const groupInfoRes = await api_client.getGroupInfo(group.id);
            return {
              ...group,
              members: groupInfoRes.success && groupInfoRes.data && groupInfoRes.data.members ? groupInfoRes.data.members : []
            };
          })
        );
        setStandaloneGroups(groupsWithMembers);
      }

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.users);
      }
    } catch (error) {
      setError('Failed to fetch data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async () => {
    try {
      const response = await api_client.createCommunity(communityName);
      if (response.success) {
        toast.success('Community created successfully');
        setShowCreateCommunity(false);
        setCommunityName('');
        fetchData();
      } else {
        toast.error(response.message || 'Failed to create community');
      }
    } catch (error) {
      toast.error('Failed to create community');
    }
  };

  const handleCreateGroup = async () => {
    try {
      let response;

      if (selectedCommunity) {
        // Create community group
        response = await api_client.createCommunityGroup(selectedCommunity.id, {
          title: groupTitle,
          active_time_slots: [{ start_time: groupStartTime, end_time: groupEndTime }],
          member_ids: selectedMembers
        });
      } else {
        // Create standalone group
        response = await api_client.createGroup(groupTitle, selectedMembers);
      }

      if (response.success) {
        toast.success('Group created successfully');
        setShowCreateGroup(false);
        setGroupTitle('');
        setGroupStartTime('13:00');
        setGroupEndTime('15:00');
        setSelectedMembers([]);
        setSelectedCommunity(null);
        fetchData();
      } else {
        toast.error(response.message || 'Failed to create group');
      }
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      let response;
      if (deleteTarget.type === 'community') {
        response = await api_client.deleteCommunity(deleteTarget.id);
      } else {
        response = await api_client.deleteConversation(deleteTarget.id);
      }

      if (response.success) {
        toast.success(`${deleteTarget.type === 'community' ? 'Community' : 'Group'} deleted successfully`);
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
        fetchData();
      } else {
        toast.error(response.message || `Failed to delete ${deleteTarget.type}`);
      }
    } catch (error) {
      toast.error(`Failed to delete ${deleteTarget.type}`);
    }
  };


  const renderCommunitiesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Communities</h2>
        <Button onClick={() => setShowCreateCommunity(true)}>
          Create Community
        </Button>
      </div>

      <div className="grid gap-4">
        {communities.map((community) => (
          <Card key={community.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{community.name}</CardTitle>
                  <CardDescription>
                    Created: {new Date(community.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCommunity(community);
                      setShowEditCommunity(true);
                    }}
                  >
                    Edit Community
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCommunity(community);
                      setShowCreateGroup(true);
                    }}
                  >
                    Add Group
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleteTarget({ type: 'community', id: community.id, name: community.name });
                      setShowDeleteConfirm(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Groups: {community.groups?.length || 0}</Badge>
                  <Badge variant="secondary">Total Group IDs: {community.group_ids?.length || 0}</Badge>
                </div>
                {community.groups && Array.isArray(community.groups) && community.groups.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Groups:</h4>
                    <div className="space-y-2">
                      {community.groups.map((group) => (
                        <div key={group.id} className="flex justify-between items-center p-2 border rounded-lg">
                          <div>
                            <span className="font-medium">{group.title}</span>
                            <div className="text-sm text-muted-foreground">
                              Created: {new Date(group.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGroup(group);
                                setShowEditGroupMembers(true);
                              }}
                            >
                              Edit Members
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGroup(group);
                                setShowEditGroupDetails(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setDeleteTarget({ type: 'group', id: group.id, name: group.title });
                                setShowDeleteConfirm(true);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderGroupsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Standalone Groups</h2>
        <Button onClick={() => setShowCreateGroup(true)}>
          Create Group
        </Button>
      </div>

      <div className="grid gap-4">
        {standaloneGroups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{group.title}</CardTitle>
                  <CardDescription>
                    Created: {new Date(group.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowEditGroupDetails(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleteTarget({ type: 'group', id: group.id, name: group.title });
                      setShowDeleteConfirm(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Members: {group.members && Array.isArray(group.members) ? group.members.length : 0}</Badge>
                <Badge variant="secondary">Type: {group.type}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className='flex items-center justify-between'>
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Group Management</h1>
              <p className="text-muted-foreground">Manage communities and groups</p>
            </div>
            <TabsList className="flex ">
              <TabsTrigger value="communities">Communities</TabsTrigger>
              <TabsTrigger value="groups">Standalone Groups</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="communities" className="mt-6">
            {renderCommunitiesTab()}
          </TabsContent>
          <TabsContent value="groups" className="mt-6">
            {renderGroupsTab()}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Community Dialog */}
      <Dialog open={showCreateCommunity} onOpenChange={setShowCreateCommunity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Community</DialogTitle>
            <DialogDescription>
              Create a new community to organize groups.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className='flex flex-col gap-2'>
              <Label htmlFor="community-name">Name</Label>
              <Input
                id="community-name"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                placeholder="Enter community name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCommunity(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCommunity} disabled={!communityName.trim()}>
              Create Community
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Community Edit Dialog */}
      <CommunityEditDialog
        isOpen={showEditCommunity}
        onClose={() => setShowEditCommunity(false)}
        community={selectedCommunity}
        onSave={fetchData}
      />

      {/* Group Edit Dialog */}
      <GroupEditDialog
        isOpen={showEditGroupMembers}
        onClose={() => setShowEditGroupMembers(false)}
        group={selectedGroup}
        onSave={fetchData}
      />

      {/* Group Edit Details Dialog */}
      <GroupEditDetailsDialog
        isOpen={showEditGroupDetails}
        onClose={() => setShowEditGroupDetails(false)}
        group={selectedGroup}
        onSave={fetchData}
      />

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Create a new group {selectedCommunity ? `in ${selectedCommunity.name}` : 'standalone group'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className='flex flex-col gap-2'>
              <Label htmlFor="group-title">Group Title</Label>
              <Input
                id="group-title"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="Enter group title"
              />
            </div>
            {selectedCommunity && (
              <div className="grid grid-cols-2 gap-4">
                <div className='flex flex-col gap-2'>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={groupStartTime}
                    onChange={(e) => setGroupStartTime(e.target.value)}
                  />
                </div>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={groupEndTime}
                    onChange={(e) => setGroupEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupTitle.trim()}>
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
