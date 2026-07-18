"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api_client } from "@/lib/api-client";
import { MessageSquare, Eye, ArrowLeft, ArrowRight, RefreshCw, Trash2, AlertTriangle, Download, FileText, FileIcon, Search, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  iconOnly?: boolean;
}

export function MessageViewerDialog({
  conversationId,
  conversationTitle,
  conversationType,
  iconOnly = false
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDeleted, setFilterDeleted] = useState<string>("all");

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
        // Sort messages by ID in ascending order
        const sortedMessages = [...response.data.messages].sort((a, b) => a.id - b.id);
        setMessages(sortedMessages);
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

  // Filter and search messages
  const filteredMessages = messages.filter((message) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        message.body?.toLowerCase().includes(query) ||
        message.senderName?.toLowerCase().includes(query) ||
        message.attachments?.file_name?.toLowerCase().includes(query) ||
        false;
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== "all") {
      if (filterType === "attachment") {
        // For attachments, check if message has attachments field populated
        if (!message.attachments) {
          return false;
        }
      } else {
        // For other types, check the type field
        if (message.type !== filterType) {
          return false;
        }
      }
    }

    // Deleted filter
    if (filterDeleted === "deleted" && !message.deleted) {
      return false;
    }
    if (filterDeleted === "active" && message.deleted) {
      return false;
    }

    return true;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderAttachment = (attachment: any) => {
    const { url, category, file_name, file_size, mime_type } = attachment;

    switch (category) {
      case "images":
        return (
          <div className="mt-2">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <img
                src={url}
                alt={file_name}
                className="w-auto max-w-full sm:max-w-md max-h-96 rounded-lg border object-contain hover:opacity-90 transition-opacity cursor-pointer"
              />
            </a>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{file_name}</span>
              <span>{formatFileSize(file_size)}</span>
            </div>
          </div>
        );

      case "videos":
        return (
          <div className="mt-2">
            <video
              controls
              className="w-full max-w-full sm:max-w-md max-h-96 rounded-lg border"
              preload="metadata"
            >
              <source src={url} type={mime_type} />
              Your browser does not support the video tag.
            </video>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{file_name}</span>
              <span>{formatFileSize(file_size)}</span>
            </div>
          </div>
        );

      case "audios":
        return (
          <div className="mt-2 p-4 border rounded-lg bg-gray-50">
            <audio controls className="w-full max-w-md">
              <source src={url} type={mime_type} />
              Your browser does not support the audio tag.
            </audio>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{file_name}</span>
              <span>{formatFileSize(file_size)}</span>
            </div>
          </div>
        );

      case "docs":
      default:
        return (
          <div className="mt-2 p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium group-hover:text-blue-600 transition-colors">
                    {file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mime_type} • {formatFileSize(file_size)}
                  </p>
                </div>
              </div>
              <Download className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
            </a>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={iconOnly ? "px-2" : "flex-1"}>
          <MessageSquare className={iconOnly ? "h-3 w-3" : "h-4 w-4 mr-2"} />
          {!iconOnly && "View Messages"}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 pr-8 text-base sm:text-lg">
            <MessageSquare className="h-5 w-5 shrink-0" />
            <span className="truncate">Messages - {conversationTitle}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0 px-4 sm:px-6 pt-4">
          {/* Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="outline">{conversationType}</Badge>
              {pagination && (
                <span className="text-sm text-muted-foreground">
                  {filteredMessages.length} of {pagination.totalCount} messages
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="shrink-0">
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search messages by content, sender, or filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="flex-1 min-w-0 sm:flex-none sm:w-[140px]">
                  <Filter className="h-4 w-4 mr-2 hidden sm:inline-flex" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="attachment">Attachment</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterDeleted} onValueChange={setFilterDeleted}>
                <SelectTrigger className="flex-1 min-w-0 sm:flex-none sm:w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="deleted">Deleted Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading messages...</p>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{searchQuery || filterType !== "all" || filterDeleted !== "all" ? "No messages match your filters" : "No messages found"}</p>
                {(searchQuery || filterType !== "all" || filterDeleted !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("all");
                      setFilterDeleted("all");
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div 
                  key={message.id} 
                  className={`border rounded-lg p-4 transition-all ${
                    message.deleted 
                      ? "bg-gray-50 opacity-75 border-gray-200" 
                      : "bg-white hover:bg-gray-50 hover:shadow-sm border-gray-200"
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Avatar/Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {message.senderProfilePic ? (
                          <img
                            src={message.senderProfilePic}
                            alt={message.senderName || "User"}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {message.senderName?.[0]?.toUpperCase() || message.sender_id.toString()[0]}
                          </div>
                        )}
                      </div>

                      {/* Message Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-gray-900">
                            {message.senderName || `User ${message.sender_id}`}
                          </span>
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
                          <span className="text-xs text-muted-foreground ml-auto">
                            ID: {message.id}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Delete message"
                          onClick={() => handleDeleteClick(message)}
                          disabled={deletingMessageId === message.id}
                          className="h-11 w-11 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deletingMessageId === message.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Message Body */}
                  {message.body && (
                    <div className="mb-3 ml-0 sm:ml-11">
                      <p className={`text-sm whitespace-pre-wrap break-words ${
                        message.deleted ? "text-muted-foreground italic" : "text-gray-800"
                      }`}>
                        {message.body}
                      </p>
                    </div>
                  )}

                  {/* Attachments */}
                  {message.attachments && (
                    <div className="mb-3 ml-0 sm:ml-11">
                      <div className="inline-flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          <FileIcon className="h-3 w-3 mr-1" />
                          Attachment
                        </Badge>
                      </div>
                      {renderAttachment(message.attachments)}
                    </div>
                  )}

                  {/* Reply Context */}
                  {message.metadata?.reply_to && (
                    <div className="mb-3 ml-0 sm:ml-11 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r text-sm">
                      <p className="font-medium text-blue-900 mb-1">Replying to:</p>
                      <p className="text-blue-700 text-xs">{message.metadata.reply_to.body}</p>
                    </div>
                  )}

                  {/* Edit Indicator */}
                  {message.edited_at && (
                    <div className="text-xs text-muted-foreground ml-0 sm:ml-11 italic">
                      Edited at {formatMessageTime(message.edited_at)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="shrink-0 flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-t">
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
          <DialogFooter>
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
