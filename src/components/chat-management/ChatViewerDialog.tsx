"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api_client } from "@/lib/api-client";
import { Eye, Users, MessageSquare, Clock } from "lucide-react";

interface ChatViewerDialogProps {
  conversationId: number;
  conversationTitle: string;
  conversationType: "group" | "dm" | "community_group";
}

export function ChatViewerDialog({
  conversationId,
  conversationTitle,
  conversationType
}: ChatViewerDialogProps) {
  const [open, setOpen] = useState(false);
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && conversationType === "group") {
      loadGroupDetails();
    }
  }, [open]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await api_client.getChatManagementGroupDetails(conversationId);
      if (response.success) {
        setGroupDetails(response.data);
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
        <Button variant="outline" size="sm" className="flex-1">
          <Eye className="h-4 w-4 mr-2" />
          View Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Chat Details - {conversationTitle}
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
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    conversationType === "group" ? "bg-blue-500" : 
                    conversationType === "dm" ? "bg-purple-500" : "bg-green-500"
                  }`}>
                    <span className="text-white font-semibold">
                      {conversationType === "group" ? "G" : 
                       conversationType === "dm" ? "D" : "C"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{conversationTitle}</h3>
                    <Badge variant="outline">{conversationType}</Badge>
                  </div>
                </div>

                {groupDetails?.group && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium">Created</p>
                      <p className="text-blue-900">
                        {formatDate(groupDetails.group.created_at || groupDetails.group.createdAt)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">Last Activity</p>
                      <p className="text-green-900">
                        {groupDetails.group.last_message_at ? 
                          formatDate(groupDetails.group.last_message_at) : 
                          "No activity"
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Members Section */}
              {groupDetails?.members && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4" />
                    <h4 className="font-medium">Members ({groupDetails.members.length})</h4>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {groupDetails.members.map((member: any) => (
                      <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {member.userName?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{member.userName || `User ${member.userId}`}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {formatDate(member.joinedAt)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {member.role || "member"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Type:</span>
                    <span className="text-sm text-muted-foreground">{conversationType}</span>
                  </div>
                  {groupDetails?.group?.createrName && (
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Created by:</span>
                      <span className="text-sm text-muted-foreground">{groupDetails.group.createrName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Messages
                </Button>
                <Button variant="outline" className="flex-1">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
