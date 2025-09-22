'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api_client, type UserType, type CommunityGroup, type StandaloneGroup } from '@/lib/api-client';
import { toast } from 'sonner';
import BouncingBalls from '../ui/bouncing-balls';

interface GroupEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  group: CommunityGroup | StandaloneGroup | null;
  onSave: () => void;
}

interface PaginatedUsers {
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

export default function GroupEditDialog({ isOpen, onClose, group, onSave }: GroupEditDialogProps) {
  const [currentMembers, setCurrentMembers] = useState<UserType[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<number[]>([]);
  const [selectedUsersToRemove, setSelectedUsersToRemove] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      setSelectedUsersToAdd([]);
      setSelectedUsersToRemove([]);
      setCurrentPage(1);
      setSearchTerm('');
      fetchGroupMembers();
      fetchAvailableUsers(1, '');
    }
  }, [isOpen, group]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm, isOpen]);

  const fetchGroupMembers = async () => {
    if (!group) return;

    try {
      setMembersLoading(true);
      const response = await api_client.getChatManagementGroupDetails(group.id);
      console.log('Group info response:', response); // Debug log

      if (response.success && response.data) {
        // Handle different response structures
        let members = [];

        if (response.data.members && Array.isArray(response.data.members)) {
          // If members is an array of objects with user property
          members = response.data.members
            .map((member: any) => {
              if (member.user) {
                return member.user;
              } else if (member.userId && member.userName) {
                // Handle direct member object structure
                return {
                  id: member.userId,
                  name: member.userName,
                  email: member.userEmail || '',
                  profile_pic: member.userProfilePic || null,
                };
              }
              return null;
            })
            .filter(Boolean);
        } else if (response.data.group && response.data.group.members) {
          // Handle nested structure
          members = response.data.group.members
            .map((member: any) => member.user)
            .filter(Boolean);
        }

        setCurrentMembers(members);
      } else {
        setCurrentMembers([]);
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast.error('Failed to load group members');
      setCurrentMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchAvailableUsers = async (page: number, search: string) => {
    try {
      setUsersLoading(true);
      const response = await api_client.getUsers(page, 20, search);
      if (response.success && response.data) {
        const userData = response.data as PaginatedUsers;

        // Filter out current members from available users
        const currentMemberIds = currentMembers.map(member => member.id);
        const filteredUsers = userData.users.filter(user => !currentMemberIds.includes(user.id));

        setAvailableUsers(filteredUsers);
        setTotalUsers(userData.pagination.totalCount);
        setTotalPages(userData.pagination.totalPages);
      } else {
        setAvailableUsers([]);
        setTotalUsers(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setAvailableUsers([]);
      setTotalUsers(0);
      setTotalPages(0);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (!group || selectedUsersToAdd.length === 0) return;

    try {
      setLoading(true);
      const response = await api_client.addGroupMembers(group.id, selectedUsersToAdd);

      if (response.success) {
        toast.success(`Added ${selectedUsersToAdd.length} member(s) successfully`);
        setSelectedUsersToAdd([]);
        fetchGroupMembers();
        fetchAvailableUsers(currentPage, searchTerm);
        onSave();
      } else {
        toast.error(response.message || 'Failed to add members');
      }
    } catch (error) {
      toast.error('Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMembers = async () => {
    if (!group || selectedUsersToRemove.length === 0) return;

    try {
      setLoading(true);

      // Remove members one by one
      for (const userId of selectedUsersToRemove) {
        await api_client.removeGroupMember(group.id, userId);
      }

      toast.success(`Removed ${selectedUsersToRemove.length} member(s) successfully`);
      setSelectedUsersToRemove([]);
      fetchGroupMembers();
      fetchAvailableUsers(currentPage, searchTerm);
      onSave();
    } catch (error) {
      toast.error('Failed to remove members');
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: number, action: 'add' | 'remove') => {
    if (action === 'add') {
      setSelectedUsersToAdd(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    } else {
      setSelectedUsersToRemove(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen min-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Edit Group: {group?.title}</DialogTitle>
          <DialogDescription className="text-base">
            Manage members of this group. Add or remove users as needed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Current Members */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Current Members ({currentMembers.length})
              </h3>
              {selectedUsersToRemove.length > 0 && (
                <Badge variant="destructive" className="px-2 py-1">
                  {selectedUsersToRemove.length} selected
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto border rounded-lg bg-muted/20">
              {membersLoading ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-3 text-sm text-muted-foreground">Loading members...</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {currentMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex justify-between items-center p-3 border rounded-lg transition-colors ${selectedUsersToRemove.includes(member.id)
                        ? 'bg-destructive/10 border-destructive'
                        : 'bg-background hover:bg-muted/50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{member.name}</span>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                      <Button
                        variant={selectedUsersToRemove.includes(member.id) ? "default" : "destructive"}
                        size="sm"
                        onClick={() => handleUserToggle(member.id, 'remove')}
                        disabled={loading}
                        className="min-w-[80px]"
                      >
                        {selectedUsersToRemove.includes(member.id) ? 'Selected' : 'Remove'}
                      </Button>
                    </div>
                  ))}
                  {currentMembers.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                        <span className="text-2xl">👥</span>
                      </div>
                      <p className="text-sm">No members in this group</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedUsersToRemove.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="destructive"
                  onClick={handleRemoveMembers}
                  disabled={loading}
                  className="w-full h-10"
                  size="lg"
                >
                  {loading ? 'Removing...' : `Remove ${selectedUsersToRemove.length} Selected Member${selectedUsersToRemove.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </div>

          {/* Available Users */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Available Users ({totalUsers})
              </h3>
              {selectedUsersToAdd.length > 0 && (
                <Badge variant="default" className="px-2 py-1">
                  {selectedUsersToAdd.length} selected
                </Badge>
              )}
            </div>

            <div className="mb-4">
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex-1 overflow-y-auto border rounded-lg bg-muted/20">
              {usersLoading ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <BouncingBalls balls={4} className=" fill-black stroke-black" animation="animate-bounce-md" />
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex justify-between items-center p-3 border rounded-lg transition-colors ${selectedUsersToAdd.includes(user.id)
                        ? 'bg-primary/10 border-primary'
                        : 'bg-background hover:bg-muted/50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{user.name}</span>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <Button
                        variant={selectedUsersToAdd.includes(user.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUserToggle(user.id, 'add')}
                        disabled={loading}
                        className="min-w-[80px]"
                      >
                        {selectedUsersToAdd.includes(user.id) ? 'Selected' : 'Add'}
                      </Button>
                    </div>
                  ))}
                  {availableUsers.length === 0 && !usersLoading && (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <p className="text-sm">
                        {searchTerm ? 'No users found matching your search' : 'No available users'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || usersLoading}
                >
                  ← Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={usersLoading}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || usersLoading}
                >
                  Next →
                </Button>
              </div>
            )}

            {selectedUsersToAdd.length > 0 && (
              <div className="mt-4">
                <Button
                  onClick={handleAddMembers}
                  disabled={loading}
                  className="w-full h-10"
                  size="lg"
                >
                  {loading ? 'Adding...' : `Add ${selectedUsersToAdd.length} Selected User${selectedUsersToAdd.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Users Summary */}
        {(selectedUsersToAdd.length > 0 || selectedUsersToRemove.length > 0) && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-semibold mb-3 text-base">Pending Changes:</h4>
            <div className="space-y-3">
              {selectedUsersToAdd.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-green-700 font-medium">Adding {selectedUsersToAdd.length} user{selectedUsersToAdd.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsersToAdd.map(userId => {
                      const user = [...currentMembers, ...availableUsers].find(u => u.id === userId);
                      return (
                        <Badge key={userId} variant="outline" className="text-green-700 border-green-300 bg-green-50">
                          {user?.name || `User ${userId}`}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedUsersToRemove.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-700 font-medium">Removing {selectedUsersToRemove.length} user{selectedUsersToRemove.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsersToRemove.map(userId => {
                      const user = currentMembers.find(u => u.id === userId);
                      return (
                        <Badge key={userId} variant="outline" className="text-red-700 border-red-300 bg-red-50">
                          {user?.name || `User ${userId}`}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading} size="lg">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
