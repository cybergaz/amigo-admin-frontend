'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api_client, type UserType } from '@/lib/api-client';
import { toast } from 'sonner';
import BouncingBalls from '../ui/bouncing-balls';
import { Settings, ChevronLeft, ChevronRight, Search, UserPlus, UserMinus, Shield, ShieldOff, Crown, X, Check } from 'lucide-react';

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
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);

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
        const menuElement = menuRef.current;
        const target = event.target as Node;
        const insideAnchor = dropdownElement ? dropdownElement.contains(target) : false;
        const insideMenu = menuElement ? menuElement.contains(target) : false;
        if (!insideAnchor && !insideMenu) {
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
        const data = response.data;
        let members = [];
        const roles: Record<number, 'admin' | 'member'> = {};

        if (data.createrId) {
          setCreatorId(data.createrId);
        }
        if (data.createrName) {
          setCreatorName(data.createrName);
        }

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
          members = data
            .map((member: any) => {
              if (member.user) {
                return member.user;
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

        const currentMemberIds = currentMembers.map(member => member.id);
        setCurrentMembersIds(currentMemberIds);

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
        toast.success('Member promoted to admin');
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
        toast.success('Member demoted successfully');
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
        toast.success('Group creator updated');
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

  const hasChanges = selectedUsersToAdd.length > 0 || selectedUsersToRemove.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0"
        onInteractOutside={(e) => {
          const target = e.detail.originalEvent.target as Node | null;
          if (target && menuRef.current?.contains(target)) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{groupTitle}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Manage group members, roles, and permissions
            </DialogDescription>
          </DialogHeader>
          {creatorName && creatorId && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span>Created by <span className="font-medium text-foreground">{creatorName}</span></span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Current Members */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Members</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {currentMembers.length}
                  </span>
                </div>
                {selectedUsersToRemove.length > 0 && (
                  <span className="text-xs font-medium text-red-600">
                    {selectedUsersToRemove.length} to remove
                  </span>
                )}
              </div>

              <div className="flex-1 border rounded-lg overflow-hidden">
                {membersLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                  </div>
                ) : currentMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <p className="text-sm">No members</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {currentMembers.map((member) => {
                      const memberRole = memberRoles[member.id] || (member as any).role || 'member';
                      const isCreator = creatorId === member.id;
                      const isAdmin = memberRole === 'admin';
                      const isMarkedForRemoval = selectedUsersToRemove.includes(member.id);

                      return (
                        <div
                          key={member.id}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMarkedForRemoval
                            ? 'bg-red-50'
                            : 'hover:bg-muted/30'
                            }`}
                        >
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-muted-foreground">
                              {member.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium truncate">{member.name}</span>
                              {isCreator && (
                                <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {member.user_role === 'staff' && (
                              <Badge variant="blue" className="text-[10px] px-1.5 py-0">
                                staff
                              </Badge>
                            )}
                            {isAdmin && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                admin
                              </Badge>
                            )}
                          </div>

                          {/* Actions dropdown */}
                          <div className="relative shrink-0" ref={(el) => { dropdownRefs.current[member.id] = el; }}>
                            <button
                              onClick={(e) => {
                                if (openDropdownId === member.id) {
                                  setOpenDropdownId(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 176) });
                                  setOpenDropdownId(member.id);
                                }
                              }}
                              disabled={loading}
                              className="h-11 w-11 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                            >
                              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>

                            {openDropdownId === member.id && menuPos && createPortal(
                              <div
                                ref={menuRef}
                                style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
                                className="z-[60] w-44 bg-white border rounded-lg shadow-lg py-1">
                                {!isAdmin && (
                                  <button
                                    onClick={() => { handlePromoteToAdmin(member.id); setOpenDropdownId(null); }}
                                    disabled={loading}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 disabled:opacity-50"
                                  >
                                    <Shield className="h-3.5 w-3.5" />
                                    Make Admin
                                  </button>
                                )}
                                {isAdmin && !isCreator && (
                                  <button
                                    onClick={() => { handleDemoteToMember(member.id); setOpenDropdownId(null); }}
                                    disabled={loading}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 disabled:opacity-50"
                                  >
                                    <ShieldOff className="h-3.5 w-3.5" />
                                    Remove Admin
                                  </button>
                                )}
                                {!isCreator && (
                                  <button
                                    onClick={() => { handleDeclareCreator(member.id); setOpenDropdownId(null); }}
                                    disabled={loading}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                  >
                                    <Crown className="h-3.5 w-3.5" />
                                    Make Creator
                                  </button>
                                )}
                                <div className="border-t my-1" />
                                <button
                                  onClick={() => { handleUserToggle(member.id, 'remove'); setOpenDropdownId(null); }}
                                  disabled={loading || isCreator}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left disabled:opacity-50 ${isMarkedForRemoval
                                    ? 'text-blue-600 hover:bg-blue-50'
                                    : 'text-red-600 hover:bg-red-50'
                                    }`}
                                >
                                  {isMarkedForRemoval ? <X className="h-3.5 w-3.5" /> : <UserMinus className="h-3.5 w-3.5" />}
                                  {isMarkedForRemoval ? 'Cancel Removal' : 'Remove'}
                                </button>
                              </div>,
                              document.body
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedUsersToRemove.length > 0 && selectedUsersToAdd.length === 0 && (
                <Button
                  variant="destructive"
                  onClick={handleRemoveMembers}
                  disabled={loading}
                  className="mt-3 h-9"
                  size="sm"
                >
                  {loading ? 'Removing...' : `Remove ${selectedUsersToRemove.length} Member${selectedUsersToRemove.length > 1 ? 's' : ''}`}
                </Button>
              )}
            </div>

            {/* Available Users */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {toggleStaff ? 'Staff' : 'Users'}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {totalUsers}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedUsersToAdd.length > 0 && (
                    <span className="text-xs font-medium text-green-600">
                      {selectedUsersToAdd.length} to add
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      fetchAvailableUsers(1, searchTerm, toggleStaff ? "user" : "staff");
                      setToggleStaff(!toggleStaff);
                    }}
                    disabled={usersLoading}
                    className="h-7 text-xs px-2"
                  >
                    {toggleStaff ? 'Show Users' : 'Show Staff'}
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              <div className="flex-1 border rounded-lg overflow-hidden">
                {usersLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <BouncingBalls balls={4} className="fill-muted-foreground stroke-muted-foreground" animation="animate-bounce-md" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <p className="text-sm">
                      {searchTerm ? 'No results' : `No ${toggleStaff ? 'staff' : 'users'} available`}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {availableUsers.map((user) => {
                      const isSelected = selectedUsersToAdd.includes(user.id);
                      const isMember = currentMembersIds.includes(user.id);

                      return (
                        <div
                          key={user.id}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
                            } ${isMember ? 'opacity-50' : ''}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-muted-foreground">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">{user.name}</span>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.phone}{user.email ? ` · ${user.email}` : ''}
                            </p>
                          </div>

                          {user.role === 'staff' && (
                            <Badge variant="blue" className="text-[10px] px-1.5 py-0 shrink-0">
                              staff
                            </Badge>
                          )}

                          <button
                            onClick={() => handleUserToggle(user.id, 'add')}
                            disabled={loading || isMember}
                            className={`shrink-0 h-11 w-11 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-md transition-colors disabled:opacity-50 ${isSelected
                              ? 'bg-primary text-white'
                              : isMember
                                ? 'bg-muted text-muted-foreground'
                                : 'hover:bg-muted text-muted-foreground'
                              }`}
                          >
                            {isMember ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : isSelected ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <UserPlus className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-3">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || usersLoading}
                    className="h-11 w-11 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-muted-foreground px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || usersLoading}
                    className="h-11 w-11 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {selectedUsersToAdd.length > 0 && selectedUsersToRemove.length === 0 && (
                <Button
                  onClick={handleAddMembers}
                  disabled={loading}
                  className="mt-3 h-9"
                  size="sm"
                >
                  {loading ? 'Adding...' : `Add ${selectedUsersToAdd.length} Member${selectedUsersToAdd.length > 1 ? 's' : ''}`}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {hasChanges && (
          <div className="px-6 py-4 border-t bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-xs min-w-0 flex-1">
                {selectedUsersToAdd.length > 0 && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-green-700 truncate min-w-0">
                      Adding {selectedUsersToAdd.length}: {selectedUsersToAdd.map(id => {
                        const user = [...currentMembers, ...availableUsers].find(u => u.id === id);
                        return user?.name || `#${id}`;
                      }).join(', ')}
                    </span>
                  </div>
                )}
                {selectedUsersToRemove.length > 0 && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-red-700 truncate min-w-0">
                      Removing {selectedUsersToRemove.length}: {selectedUsersToRemove.map(id => {
                        const user = currentMembers.find(u => u.id === id);
                        return user?.name || `#${id}`;
                      }).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                {selectedUsersToRemove.length > 0 && selectedUsersToAdd.length > 0 && (
                  <Button
                    onClick={handleMakeChanges}
                    disabled={loading}
                    size="sm"
                    className="h-8"
                  >
                    {loading ? 'Applying...' : 'Apply All Changes'}
                  </Button>
                )}
                <Button variant="ghost" onClick={onClose} disabled={loading} size="sm" className="h-8">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {!hasChanges && (
          <div className="px-6 py-3 border-t flex justify-end">
            <Button variant="ghost" onClick={onClose} size="sm" className="h-8">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
