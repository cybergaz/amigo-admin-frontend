"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api_client } from "@/lib/api-client";
import { UserPlus, UserMinus, Search, X } from "lucide-react";
import BouncingBalls from "../ui/bouncing-balls";

interface Member {
  userId: number;
  userName: string;
  userProfilePic?: string;
  role: string;
  joinedAt: string;
}

interface MemberManagementDialogProps {
  conversationId: number;
  groupTitle: string;
  currentMembers: Member[];
  onMembersUpdated: () => void;
  mode: "add" | "remove";
}

export function MemberManagementDialog({
  conversationId,
  groupTitle,
  currentMembers,
  onMembersUpdated,
  mode
}: MemberManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAllUsers();
    }
  }, [open]);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const response = await api_client.getUsers(1, 100, "");
      if (response.success && response.data) {
        // Filter out users who are already members
        const currentMemberIds = currentMembers.map(m => m.userId);
        const availableUsers = response.data.users.filter(
          (user: any) => !currentMemberIds.includes(user.id)
        );
        setAllUsers(availableUsers);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (userId: number) => {
    if (mode === "add") {
      setSelectedUsers(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    } else {
      setSelectedUsers([userId]);
    }
  };

  const handleAction = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setActionLoading(true);

      if (mode === "add") {
        await api_client.addMemberToChat(conversationId, selectedUsers, "member");
      } else {
        for (const userId of selectedUsers) {
          await api_client.removeMemberFromChat(conversationId, userId);
        }
      }

      onMembersUpdated();
      setOpen(false);
      setSelectedUsers([]);
      setSearchTerm("");
    } catch (error) {
      console.error("Error managing members:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1">
          {mode === "add" ? (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </>
          ) : (
            <>
              <UserMinus className="h-4 w-4 mr-2" />
              Remove Member
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Members to" : "Remove Members from"} {groupTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Current Members (for remove mode) */}
          {mode === "remove" && (
            <div>
              <h4 className="font-medium mb-2">Current Members</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {currentMembers.map((member) => (
                  <div
                    key={member.userId}
                    className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${selectedUsers.includes(member.userId)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-gray-50"
                      }`}
                    onClick={() => handleUserSelect(member.userId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {member.userName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.userName}</p>
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    {selectedUsers.includes(member.userId) && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <X className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Users (for add mode) */}
          {mode === "add" && (
            <div>
              <h4 className="font-medium mb-2">Available Users</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">
                    <BouncingBalls balls={4} className=" fill-black stroke-black" animation="animate-bounce-md" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchTerm ? "No users found matching your search." : "No available users."}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${selectedUsers.includes(user.id)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-gray-50"
                        }`}
                      onClick={() => handleUserSelect(user.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <X className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Selected Users Summary */}
          {selectedUsers.length > 0 && (
            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm font-medium">
                {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""} selected
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={selectedUsers.length === 0 || actionLoading}
              className="flex-1"
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === "add" ? "Adding..." : "Removing..."}
                </>
              ) : (
                <>
                  {mode === "add" ? "Add Members" : "Remove Members"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
