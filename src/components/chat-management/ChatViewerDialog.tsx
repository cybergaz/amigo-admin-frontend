"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api_client } from "@/lib/api-client";
import { Eye, Users, MessageSquare, Clock } from "lucide-react";

export interface ChatViewerDialogProps {
  conversationId: number;
  conversationTitle: string;
  conversationType: "group" | "dm" | "community_group";
  members?: any[];
  iconOnly?: boolean;
}

export function ChatViewerDialog({
  conversationId,
  conversationTitle,
  conversationType,
  members = [],
  iconOnly = false
}: ChatViewerDialogProps) {
  const [open, setOpen] = useState(false);
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && (conversationType === "group" || conversationType === "community_group")) {
      loadGroupDetails();
    }
  }, [open]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await api_client.getChatManagementGroupDetails(conversationId);
      if (response.success && response.data) {
        // Transform response to match expected structure
        // Response: { members: [...], createrId, createrName, createrProfilePic }
        // Expected: { group: { createrId, createrName, createrProfilePic }, members: [...] }
        setGroupDetails({
          group: {
            createrId: response.data.createrId,
            creater_id: response.data.createrId,
            createrName: response.data.createrName,
            creater_name: response.data.createrName,
            createrProfilePic: response.data.createrProfilePic,
            creater_profile_pic: response.data.createrProfilePic,
            created_at: response.data.createdAt,
            last_message_at: response.data.lastMessageAt
          },
          members: response.data.members || []
        });
      }
    } catch (error) {
      console.error("Error loading group details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={iconOnly ? "px-2" : "flex-1"}>
          <Eye className={iconOnly ? "h-3 w-3" : "h-4 w-4 mr-2"} />
          {!iconOnly && "View Details"}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8 text-base sm:text-lg">
            <Eye className="h-5 w-5 shrink-0" />
            <span className="truncate">Chat Details - {conversationTitle}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading chat details...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Overview */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${conversationType === "group" ? "bg-blue-500" :
                    conversationType === "dm" ? "bg-purple-500" : "bg-green-500"
                    }`}>
                    <span className="text-white font-semibold">
                      {conversationType === "group" ? "G" :
                        conversationType === "dm" ? "D" : "C"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg truncate">{conversationTitle}</h3>
                    <Badge variant="outline">{conversationType}</Badge>
                  </div>
                </div>

                {groupDetails?.group && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium">Created</p>
                      <p className="text-blue-900 text-sm">
                        {formatDate(groupDetails.group.created_at || groupDetails.group.createdAt)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">Last Activity</p>
                      <p className="text-green-900 text-sm">
                        {groupDetails.group.last_message_at ?
                          formatDate(groupDetails.group.last_message_at) :
                          "No activity"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Info */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4" />
                  <h4 className="font-medium">Chat Information</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Conversation ID:</span>
                    <span className="text-sm text-muted-foreground">{conversationId}</span>
                  </div>
                  {/* <div className="flex justify-between p-2 bg-gray-50 rounded"> */}
                  {/*   <span className="text-sm font-medium">Type:</span> */}
                  {/*   <span className="text-sm text-muted-foreground">{conversationType}</span> */}
                  {/* </div> */}
                  {groupDetails?.group && (
                    <>
                      {groupDetails.group.createrName && (
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Created by:</span>
                          <div className="flex flex-col items-end">
                            <span className="text-sm text-muted-foreground">{groupDetails.group.createrName}</span>
                            <span className="text-xs text-muted-foreground/80">ID: {groupDetails.group.createrId}</span>
                          </div>
                        </div>
                      )}
                      {/* {(groupDetails.group.createrId || groupDetails.group.creater_id) && ( */}
                      {/*   <div className="flex justify-between p-2 bg-gray-50 rounded"> */}
                      {/*     <span className="text-sm font-medium">Creator ID:</span> */}
                      {/*     <span className="text-sm text-muted-foreground">{groupDetails.group.createrId || groupDetails.group.creater_id}</span> */}
                      {/*   </div> */}
                      {/* )} */}
                    </>
                  )}
                </div>
              </div>

              {/* Members Section */}
              {(conversationType === "group" || conversationType === "community_group") && members.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4" />
                    <h4 className="font-medium">Members ({members.length})</h4>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {members.map((member: any) => {
                      const userId = member.userId || member.id;
                      const userName = member.userName || member.name;
                      const userEmail = member.userEmail || member.email;
                      const joinedAt = member.joinedAt || member.joined_at;

                      return (
                        <div key={userId} className="flex items-center justify-between gap-2 p-3 border rounded-lg">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 shrink-0 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {userName?.charAt(0) || "U"}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{userName || `User ${userId}`}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {userEmail || (joinedAt ? `Joined ${formatDate(joinedAt)}` : 'No info')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {member.role || "member"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              {/* <div className="flex gap-2 pt-4 border-t"> */}
              {/*   <Button variant="outline" className="flex-1"> */}
              {/*     <MessageSquare className="h-4 w-4 mr-2" /> */}
              {/*     View Messages */}
              {/*   </Button> */}
              {/*   <Button variant="outline" className="flex-1"> */}
              {/*     <Users className="h-4 w-4 mr-2" /> */}
              {/*     Manage Members */}
              {/*   </Button> */}
              {/* </div> */}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
