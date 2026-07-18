"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { api_client } from "@/lib/api-client";
import { toast } from "sonner";
import BouncingBalls from "@/components/ui/bouncing-balls";

interface SignupRequest {
  id: number;
  name: string;
  phone: string;
  status: string;
  rejected_reason: string | null;
  created_at: string;
}

export default function NewUsersRequests() {
  const [requests, setRequests] = useState<SignupRequest[]>([]);                
  const [loading, setLoading] = useState(true);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SignupRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api_client.getSignupRequests();
      if (response.success && response.data) {
        setRequests(response.data);
      } else {
        toast.error(response.message || "Failed to fetch signup requests");
      }
    } catch (error) {
      toast.error("Failed to fetch signup requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: SignupRequest) => {
    if (!confirm(`Are you sure you want to approve ${request.name}'s signup request?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await api_client.updateSignupRequestStatus({
        phone: request.phone,
        name: request.name,
        status: "accepted",
      });

      if (response.success) {
        toast.success("Signup request approved successfully");
        fetchRequests();
      } else {
        toast.error(response.message || "Failed to approve request");
      }
    } catch (error) {
      toast.error("Failed to approve request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (request: SignupRequest) => {
    setSelectedRequest(request);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setIsProcessing(true);
      const response = await api_client.updateSignupRequestStatus({
        phone: selectedRequest.phone,
        name: selectedRequest.name,
        status: "rejected",
        rejected_reason: rejectReason.trim(),
      });

      if (response.success) {
        toast.success("Signup request rejected successfully");
        setIsRejectDialogOpen(false);
        setSelectedRequest(null);
        setRejectReason("");
        fetchRequests();
      } else {
        toast.error(response.message || "Failed to reject request");
      }
    } catch (error) {
      toast.error("Failed to reject request");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BouncingBalls balls={4} className="fill-black stroke-black" animation="animate-bounce-md" />
      </div>
    );
  }

  return (
    <PageShell className="py-4 sm:py-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">New Users Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage and review user signup requests
          </p>
        </div>
        <Button onClick={fetchRequests} variant="outline" className="sm:shrink-0">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signup Requests ({requests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No signup requests found</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested At</TableHead>
                      <TableHead>Rejection Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.name}
                        </TableCell>
                        <TableCell>{request.phone}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{formatDate(request.created_at)}</TableCell>
                        <TableCell className="max-w-[24ch] lg:max-w-[36ch]">
                          {request.rejected_reason ? (
                            <span
                              className="block truncate text-sm text-red-600 italic"
                              title={request.rejected_reason}
                            >
                              {request.rejected_reason}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {request.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApprove(request)}
                                  disabled={isProcessing}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectClick(request)}
                                  disabled={isProcessing}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {request.status !== "pending" && (
                              <span className="text-sm text-muted-foreground">
                                {request.status === "accepted" ? "Already accepted" : "Already rejected"}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium min-w-0 break-words">{request.name}</span>
                      <span className="shrink-0">{getStatusBadge(request.status)}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">Phone</span>
                        <span className="min-w-0 break-words text-right">{request.phone}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">Requested</span>
                        <span className="min-w-0 break-words text-right">{formatDate(request.created_at)}</span>
                      </div>
                    </div>
                    {request.rejected_reason && (
                      <p className="text-sm text-red-600 italic break-words">
                        {request.rejected_reason}
                      </p>
                    )}
                    {request.status === "pending" ? (
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="default"
                          onClick={() => handleApprove(request)}
                          disabled={isProcessing}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectClick(request)}
                          disabled={isProcessing}
                          className="w-full"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {request.status === "accepted" ? "Already accepted" : "Already rejected"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Signup Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedRequest?.name}'s signup request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Rejection Reason *</Label>
              <Textarea
                id="rejectReason"
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason("");
                setSelectedRequest(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectReason.trim()}
            >
              {isProcessing ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

