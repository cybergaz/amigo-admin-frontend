"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, Smartphone, MonitorSmartphone } from "lucide-react";
import { api_client, type DeviceChangeRequest } from "@/lib/api-client";
import { toast } from "sonner";
import BouncingBalls from "@/components/ui/bouncing-balls";

const LIMIT = 20;

export default function DeviceRequests() {
  const [requests, setRequests] = useState<DeviceChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [confirmApprove, setConfirmApprove] = useState<DeviceChangeRequest | null>(null);
  const [denyTarget, setDenyTarget] = useState<DeviceChangeRequest | null>(null);
  const [denyReason, setDenyReason] = useState("");

  // Kill-switch (super-admin only). We detect authority by whether the settings
  // endpoint returns the value (403 → hide the control entirely).
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [savingLock, setSavingLock] = useState(false);

  const fetchRequests = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const response = await api_client.getDeviceChangeRequests(p, LIMIT);
      if (response.success && response.data) {
        setRequests(response.data.requests);
        setTotalPages(response.data.pagination.totalPages || 1);
        setTotalCount(response.data.pagination.totalCount || 0);
        setPage(response.data.pagination.currentPage || p);
      } else {
        toast.error(response.message || "Failed to fetch device change requests");
      }
    } catch {
      toast.error("Failed to fetch device change requests");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLock = useCallback(async () => {
    const res = await api_client.getSingleDeviceLock();
    if (res.success && res.data) {
      setIsSuperAdmin(true);
      setLockEnabled(res.data.enabled ?? false);
    } else {
      setIsSuperAdmin(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(1);
    fetchLock();
  }, [fetchRequests, fetchLock]);

  const toggleLock = async () => {
    const next = !lockEnabled;
    try {
      setSavingLock(true);
      const res = await api_client.setSingleDeviceLock(next);
      if (res.success && res.data) {
        setLockEnabled(res.data.enabled ?? next);
        toast.success(next ? "Single-device lock enabled" : "Single-device lock disabled");
      } else {
        toast.error(res.message || "Failed to update setting");
      }
    } catch {
      toast.error("Failed to update setting");
    } finally {
      setSavingLock(false);
    }
  };

  const handleApproveConfirm = async () => {
    const req = confirmApprove;
    if (!req) return;
    try {
      setProcessingId(req.id);
      const response = await api_client.approveDeviceChangeRequest(req.id);
      if (response.success) {
        toast.success("Device change approved");
        setConfirmApprove(null);
        fetchRequests(page);
      } else {
        toast.error(response.message || "Failed to approve request");
      }
    } catch {
      toast.error("Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async () => {
    const req = denyTarget;
    if (!req) return;
    try {
      setProcessingId(req.id);
      const response = await api_client.denyDeviceChangeRequest(req.id, denyReason.trim() || undefined);
      if (response.success) {
        toast.success("Device change denied");
        setDenyTarget(null);
        setDenyReason("");
        fetchRequests(page);
      } else {
        toast.error(response.message || "Failed to deny request");
      }
    } catch {
      toast.error("Failed to deny request");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const requestedLabel = (r: DeviceChangeRequest) => {
    if (!r.requested_device_id) return "Next device to log in";
    const parts: string[] = [];
    if (r.device_name) parts.push(r.device_name);
    if (r.platform) parts.push(`(${r.platform})`);
    return parts.length ? parts.join(" ") : r.requested_device_id.slice(0, 8);
  };

  const statusBadge = (r: DeviceChangeRequest) => {
    switch (r.status.toLowerCase()) {
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            {r.consumed_at ? "Approved · used" : "Approved"}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BouncingBalls balls={4} className="fill-black stroke-black" animation="animate-bounce-md" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MonitorSmartphone className="w-7 h-7 text-accent-rblue-dark" />
            Device Change Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Approve to let a user move their account to a new device. On approval, the
            user logs in on the new device and the old device is signed out automatically.
          </p>
        </div>
        <Button onClick={() => fetchRequests(page)} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Kill-switch — super-admin only */}
      {isSuperAdmin && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col">
              <span className="font-medium">Enforce single-device lock</span>
              <span className="text-sm text-accent-gray">
                When off, a new device silently takes over on login (legacy behaviour) and
                no approval is required. When on, a new device is refused until approved here.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={lockEnabled}
              disabled={savingLock}
              onClick={toggleLock}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                lockEnabled ? "bg-accent-rblue-dark" : "bg-gray-300"
              } ${savingLock ? "opacity-60" : ""}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  lockEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Requests ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">No device change requests</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To (requested)</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.name || <span className="text-muted-foreground">Unknown</span>}
                        </TableCell>
                        <TableCell>{r.phone || "-"}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {r.current_device_name || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            <Smartphone className="w-3 h-3 mr-1" />
                            {requestedLabel(r)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {r.reason || "-"}
                          </span>
                        </TableCell>
                        <TableCell>{statusBadge(r)}</TableCell>
                        <TableCell>{formatDate(r.created_at)}</TableCell>
                        <TableCell className="text-right">
                          {r.status.toLowerCase() === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => setConfirmApprove(r)}
                                disabled={processingId === r.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setDenyTarget(r);
                                  setDenyReason("");
                                }}
                                disabled={processingId === r.id}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Deny
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Reviewed</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => fetchRequests(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => fetchRequests(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Approve confirmation */}
      <Dialog
        open={confirmApprove !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmApprove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve device change?</DialogTitle>
            <DialogDescription>
              <span className="font-medium">{confirmApprove?.name || "This user"}</span>
              {confirmApprove?.phone ? ` (${confirmApprove.phone})` : ""} will be able to log in
              on their new device. Their current device will be signed out automatically the
              moment the new device logs in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApprove(null)} disabled={processingId !== null}>
              Cancel
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={processingId !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {processingId !== null ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny with reason */}
      <Dialog
        open={denyTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDenyTarget(null);
            setDenyReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny device change?</DialogTitle>
            <DialogDescription>
              Optionally tell{" "}
              <span className="font-medium">{denyTarget?.name || "the user"}</span> why their
              request was denied. They&apos;ll see this on the request screen.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional)"
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDenyTarget(null);
                setDenyReason("");
              }}
              disabled={processingId !== null}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeny} disabled={processingId !== null}>
              <XCircle className="w-4 h-4 mr-1" />
              {processingId !== null ? "Denying..." : "Deny request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
