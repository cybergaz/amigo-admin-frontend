"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api_client } from "@/lib/api-client";
import { MessageSquare, Eye, ArrowLeft, ArrowRight, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  senderName?: string;
  senderProfilePic?: string;
  type: string;
  body?: string;
  attachments?: any;
  metadata?: any;
  edited_at?: string;
  created_at: string;
  deleted: boolean;
  forwarded_from?: number;
  forwarded_count?: number[];
}

interface MessageViewerDialogProps {
  conversationId: number;
  conversationTitle: string;
  conversationType: "group" | "dm" | "community_group";
}

export function MessageViewerDialog({
  conversationId,
  conversationTitle,
  conversationType
}: MessageViewerDialogProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  useEffect(() => {
    if (open) {
      loadMessages();
    }
  }, [open, currentPage]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await api_client.getConversationHistory(conversationId, currentPage, 20);
      if (response.success && response.data) {
        setMessages(response.data.messages);
        setPagination(response.data.pagination);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return "💬";
      case "attachment":
        return "📎";
      case "system":
        return "⚙️";
      default:
        return "💬";
    }
  };

  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case "text":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Text</Badge>;
      case "attachment":
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Attachment</Badge>;
      case "system":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">System</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleRefresh = () => {
    loadMessages();
  };

  const handleDeleteClick = (message: Message) => {
    setMessageToDelete(message);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;

    try {
      setDeletingMessageId(messageToDelete.id);
      await api_client.permanentlyDeleteMessage(messageToDelete.id);

      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageToDelete.id));

      // Update pagination
      if (pagination) {
        setPagination((prev: any) => ({
          ...prev,
          totalCount: prev.totalCount - 1
        }));
      }

      toast.success("Message deleted successfully");
      setShowDeleteConfirm(false);
      setMessageToDelete(null);
    } catch (error) {
      console.error("Error permanently deleting message:", error);
      toast.error("Failed to delete message. Please try again.");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1">
          <MessageSquare className="h-4 w-4 mr-2" />
          View Messages
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages - {conversationTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-y-scroll">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{conversationType}</Badge>
              {pagination && (
                <span className="text-sm text-muted-foreground">
                  {pagination.totalCount} total messages
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages found</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getMessageTypeIcon(message.type)}</span>
                      <span className="font-medium">{message.senderName || `User ${message.sender_id}`}</span>
                      {getMessageTypeBadge(message.type)}
                      {message.deleted && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Deleted
                        </Badge>
                      )}
                      {message.forwarded_from && (
                        <Badge variant="outline" className="text-xs">
                          Forwarded
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {formatMessageTime(message.created_at)}
                      </span>
                      {!message.deleted && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(message)}
                          disabled={deletingMessageId === message.id}
                          className="h-6 w-6 p-0"
                        >
                          {deletingMessageId === message.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {message.body && (
                    <div className="mb-3">
                      <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                    </div>
                  )}

                  {message.attachments && (
                    <div className="mb-3">
                      <Badge variant="secondary" className="mb-2">
                        📎 Attachment
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {JSON.stringify(message.attachments, null, 2)}
                      </div>
                    </div>
                  )}

                  {message.metadata?.reply_to && (
                    <div className="mb-3 p-2 bg-gray-100 rounded text-sm">
                      <p className="font-medium">Replying to:</p>
                      <p className="text-muted-foreground">{message.metadata.reply_to.body}</p>
                    </div>
                  )}

                  {message.edited_at && (
                    <div className="text-xs text-muted-foreground">
                      Edited at {formatMessageTime(message.edited_at)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || loading}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete Message
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to permanently delete this message? This action cannot be undone.
              {messageToDelete && (
                <div className="mt-3 p-3 bg-muted rounded-lg border-l-4 border-destructive">
                  <p className="text-sm font-medium text-foreground">Message Preview:</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    From: {messageToDelete.senderName || `User ${messageToDelete.sender_id}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatMessageTime(messageToDelete.created_at)}
                  </p>
                  {messageToDelete.body && (
                    <p className="text-sm text-foreground mt-2 font-mono bg-background p-2 rounded border max-h-20 overflow-y-auto">
                      {messageToDelete.body.length > 100 
                        ? `${messageToDelete.body.substring(0, 100)}...` 
                        : messageToDelete.body}
                    </p>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deletingMessageId === messageToDelete?.id}
            >
              {deletingMessageId === messageToDelete?.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
