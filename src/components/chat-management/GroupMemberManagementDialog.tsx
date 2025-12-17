'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api_client, type UserType } from '@/lib/api-client';
import { toast } from 'sonner';
import BouncingBalls from '../ui/bouncing-balls';
import { Settings } from 'lucide-react';

interface GroupMemberManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
  groupTitle: string;
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

export function GroupMemberManagementDialog({
  isOpen,
  onClose,
  conversationId,
  groupTitle,
  onSave
}: GroupMemberManagementDialogProps) {
  const [currentMembers, setCurrentMembers] = useState<UserType[]>([]);
  const [currentMembersIds, setCurrentMembersIds] = useState<number[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<number[]>([]);
  const [selectedUsersToRemove, setSelectedUsersToRemove] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [toggleStaff, setToggleStaff] = useState(false);
  const [creatorId, setCreatorId] = useState<number | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [memberRoles, setMemberRoles] = useState<Record<number, 'admin' | 'member'>>({});
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUsersToAdd([]);
      setSelectedUsersToRemove([]);
      setCurrentPage(1);
      setSearchTerm('');
      setOpenDropdownId(null);
      fetchGroupMembers();
      fetchAvailableUsers(1, '');
    }
  }, [isOpen, conversationId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId !== null) {
        const dropdownElement = dropdownRefs.current[openDropdownId];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdownId(null);
        }
      }
    };

    if (openDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openDropdownId]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm, isOpen]);

  const fetchGroupMembers = async () => {
    try {
      setMembersLoading(true);
      const response = await api_client.getChatManagementGroupDetails(conversationId);

      if (response.success && response.data) {
        // Handle response structure: { members: [...], createrId, createrName, createrProfilePic }
        const data = response.data;
        let members = [];
        const roles: Record<number, 'admin' | 'member'> = {};

        // Extract creator info
        if (data.createrId) {
          setCreatorId(data.createrId);
        }
        if (data.createrName) {
          setCreatorName(data.createrName);
        }

        // Extract members
        if (data.members && Array.isArray(data.members)) {
          members = data.members.map((member: any) => {
            const userId = member.userId || member.user_id || member.id;
            const role = member.role || 'member';
            roles[userId] = role as 'admin' | 'member';

            if (member.user) {
              return {
                ...member.user,
                id: userId,
                role: role
              };
            } else if (userId && (member.userName || member.user_name)) {
              return {
                id: userId,
                name: member.userName || member.user_name,
                email: member.userEmail || member.user_email || '',
                profile_pic: member.userProfilePic || member.user_profile_pic || null,
                user_role: member.user_role,
                role: role
              };
            }
            return null;
          }).filter(Boolean);
        } else if (Array.isArray(data)) {
          // Fallback for old format
          members = data
            .map((member: any) => {
              if (member.user) {
                return member.user
              } else if (member.userId && member.userName) {
                return {
                  id: member.userId,
                  name: member.userName,
                  email: member.userEmail || '',
                  profile_pic: member.userProfilePic || null,
                  user_role: member.user_role,
                  role: member.role || 'member'
                };
              }
              return null;
            })
            .filter(Boolean);
        }

        setCurrentMembers(members);
        setMemberRoles(roles);
      } else {
        setCurrentMembers([]);
        setMemberRoles({});
      }
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast.error('Failed to load group members');
      setCurrentMembers([]);
      setMemberRoles({});
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchAvailableUsers = async (page: number, search: string, user_role: string = "user") => {
    try {
      setUsersLoading(true);
      const response = await api_client.getUsers(page, 20, search, user_role);
      if (response.success && response.data) {
        const userData = response.data as PaginatedUsers;

        // Filter out current members from available users
        const currentMemberIds = currentMembers.map(member => member.id);
        setCurrentMembersIds(currentMemberIds);
        // let filteredUsers = userData.users.filter(user => !currentMemberIds.includes(user.id));

        setAvailableUsers(userData.users);
        setTotalUsers(userData.pagination.totalCount);
        setTotalPages(userData.pagination.totalPages);
        setToggleStaff(user_role === "staff");
      } else {
        setAvailableUsers([]);
        setTotalUsers(0);
        setTotalPages(0);
        setToggleStaff(user_role === "staff");
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setAvailableUsers([]);
      setTotalUsers(0);
      setTotalPages(0);
    } finally {
      setUsersLoading(false);
      setToggleStaff(user_role === "staff");
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsersToAdd.length === 0) return;

    try {
      setLoading(true);
      const response = await api_client.addMemberToChat(conversationId, selectedUsersToAdd);

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
    if (selectedUsersToRemove.length === 0) return;

    try {
      setLoading(true);

      // Remove members one by one
      for (const userId of selectedUsersToRemove) {
        await api_client.removeMemberFromChat(conversationId, userId);
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

  const handleMakeChanges = async () => {
    if (selectedUsersToAdd.length === 0 && selectedUsersToRemove.length === 0) return;

    try {
      await handleAddMembers();
      await handleRemoveMembers();
    } catch (error) {
      toast.error('Failed to make changes');
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
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePromoteToAdmin = async (userId: number) => {
    try {
      setLoading(true);
      const response = await api_client.promoteToAdmin(conversationId, userId);
      if (response.success) {
        toast.success('Member promoted to admin successfully');
        fetchGroupMembers();
        onSave();
      } else {
        toast.error(response.message || 'Failed to promote member');
      }
    } catch (error) {
      toast.error('Failed to promote member');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoteToMember = async (userId: number) => {
    try {
      setLoading(true);
      const response = await api_client.demoteToMember(conversationId, userId);
      if (response.success) {
        toast.success('Member demoted to member successfully');
        fetchGroupMembers();
        onSave();
      } else {
        toast.error(response.message || 'Failed to demote member');
      }
    } catch (error) {
      toast.error('Failed to demote member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclareCreator = async (userId: number) => {
    try {
      setLoading(true);
      const response = await api_client.forceDeclareGroupCreator(conversationId, userId);
      if (response.success) {
        toast.success('Group creator updated successfully');
        fetchGroupMembers();
        onSave();
      } else {
        toast.error(response.message || 'Failed to update group creator');
      }
    } catch (error) {
      toast.error('Failed to update group creator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen min-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Manage Members: {groupTitle}</DialogTitle>
          <DialogDescription className="text-base">
            Add or remove members from this group. Promote/demote admins and change group creator.
          </DialogDescription>
          {creatorName && creatorId && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Group Creator:</span> {creatorName} (ID: {creatorId})
              </p>
            </div>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Current Members */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Current Members ({currentMembers.length})
              </h3>
              {selectedUsersToRemove.length > 0 && (
                <Badge variant="destructiveLite" className="px-2 py-1">
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
                  {currentMembers.map((member) => {
                    const memberRole = memberRoles[member.id] || (member as any).role || 'member';
                    const isCreator = creatorId === member.id;
                    const isAdmin = memberRole === 'admin';

                    return (
                      <div
                        key={member.id}
                        className={`flex justify-between items-center p-3 border rounded-lg transition-colors ${selectedUsersToRemove.includes(member.id)
                          ? 'bg-destructive/10 border-destructive'
                          : isCreator
                            ? 'bg-yellow-50 border-yellow-300'
                            : 'bg-background hover:bg-muted/50'
                          }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.name}</span>
                              {isCreator && (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                  Creator
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>

                        <div className='flex gap-2 justify-center items-center'>
                          <Badge variant={member.user_role === 'staff' ? "blue" : "secondary"} >
                            {member.user_role}
                          </Badge>
                          <Badge variant={isAdmin ? "default" : "outline"}>
                            group {memberRole}
                          </Badge>
                          <div className="relative" ref={(el) => { dropdownRefs.current[member.id] = el; }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)}
                              disabled={loading}
                              className="h-8 w-8 p-0"
                              title="Member actions"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            {openDropdownId === member.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                                <div className="p-1">
                                  {!isAdmin && (
                                    <Button
                                      onClick={() => {
                                        handlePromoteToAdmin(member.id);
                                        setOpenDropdownId(null);
                                      }}
                                      disabled={loading}
                                      className="w-full text-left px-4 py-2 text-sm text-black bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Promote to Admin
                                    </Button>
                                  )}
                                  {isAdmin && !isCreator && (
                                    <Button
                                      onClick={() => {
                                        handleDemoteToMember(member.id);
                                        setOpenDropdownId(null);
                                      }}
                                      disabled={loading}
                                      className="w-full text-left px-4 py-2 text-sm text-black bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Demote to Member
                                    </Button>
                                  )}
                                  {!isCreator && (
                                    <Button
                                      onClick={() => {
                                        handleDeclareCreator(member.id);
                                        setOpenDropdownId(null);
                                      }}
                                      disabled={loading}
                                      className="w-full text-left px-4 py-2 text-sm text-yellow-700 bg-white hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Make Group Creator
                                    </Button>
                                  )}
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <Button
                                    onClick={() => {
                                      handleUserToggle(member.id, 'remove');
                                      setOpenDropdownId(null);
                                    }}
                                    disabled={loading || isCreator}
                                    className={`w-full text-left bg-white px-4 py-2 text-sm ${selectedUsersToRemove.includes(member.id)
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'text-red-700 hover:bg-red-50'
                                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {selectedUsersToRemove.includes(member.id) ? 'Deselect for Removal' : 'Remove from Group'}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

            {selectedUsersToRemove.length > 0 && selectedUsersToAdd.length === 0 && (
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
                Available {toggleStaff ? "Staff" : "Users"} ({totalUsers})
              </h3>
              {selectedUsersToAdd.length > 0 && (
                <Badge variant="positive" className="px-2 py-1">
                  {selectedUsersToAdd.length} selected
                </Badge>
              )}
              <Button
                variant={"outline"}
                size="sm"
                onClick={() => {
                  fetchAvailableUsers(1, searchTerm, toggleStaff ? "user" : "staff");
                  setToggleStaff(!toggleStaff);
                }}
                disabled={usersLoading}
              >
                {toggleStaff ? "Show Users" : "Show Staff"}
              </Button>
            </div>

            <div className="mb-4">
              <Input
                placeholder="Search users by name or phone..."
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
                          <div className="text-sm text-muted-foreground">{user.phone}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className='flex gap-2 justify-center items-center'>
                        <Badge variant={user.role === 'staff' ? "blue" : "secondary"} >
                          {user.role}
                        </Badge>
                        <Button
                          variant={selectedUsersToAdd.includes(user.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUserToggle(user.id, 'add')}
                          disabled={loading || currentMembersIds.includes(user.id)}
                          className="min-w-[80px]"
                        >
                          {selectedUsersToAdd.includes(user.id) ? 'Selected' : 'Add'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {availableUsers.length === 0 && !usersLoading && (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <p className="text-sm">
                        {searchTerm ? 'No users found matching your search' : toggleStaff ? "No Available Staff" : "No available User"}
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

            {selectedUsersToAdd.length > 0 && selectedUsersToRemove.length === 0 && (
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
          {
            selectedUsersToRemove.length > 0 && selectedUsersToAdd.length > 0 &&
            <Button variant="outline" onClick={handleMakeChanges} disabled={loading} size="lg" className='bg-green-500 text-white hover:bg-green-600 hover:text-white cursor-pointer font-semibold'>
              Make Changes
            </Button>
          }
          <Button variant="outline" onClick={onClose} disabled={loading} size="lg" className='cursor-pointer'>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

