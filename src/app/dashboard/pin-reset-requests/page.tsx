"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, KeyRound, ShieldCheck } from "lucide-react";
import { api_client, type PinResetRequest } from "@/lib/api-client";
import { toast } from "sonner";
import BouncingBalls from "@/components/ui/bouncing-balls";

const LIMIT = 20;

export default function PinResetRequests() {
  const [requests, setRequests] = useState<PinResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // "Set new PIN" dialog.
  const [pinTarget, setPinTarget] = useState<PinResetRequest | null>(null);
  const [pinValue, setPinValue] = useState("");
  // "Dismiss" confirmation dialog.
  const [dismissTarget, setDismissTarget] = useState<PinResetRequest | null>(null);

  const fetchRequests = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const response = await api_client.getPinResetRequests(p, LIMIT);
      if (response.success && response.data) {
        setRequests(response.data.requests);
        setTotalPages(response.data.pagination.totalPages || 1);
        setTotalCount(response.data.pagination.totalCount || 0);
        setPage(response.data.pagination.currentPage || p);
      } else {
        toast.error(response.message || "Failed to fetch reset-PIN requests");
      }
    } catch {
      toast.error("Failed to fetch reset-PIN requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const handleSetPin = async () => {
    const req = pinTarget;
    if (!req || pinValue.length !== 4) return;
    try {
      setProcessingId(req.id);
      const response = await api_client.updateUserPasswordPin(req.user_id, pinValue);
      if (response.success) {
        toast.success(`New PIN set for ${req.name || "user"}. Share it so they can log in.`);
        setPinTarget(null);
        setPinValue("");
        fetchRequests(page);
      } else {
        toast.error(response.message || "Failed to set the PIN");
      }
    } catch {
      toast.error("Failed to set the PIN");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async () => {
    const req = dismissTarget;
    if (!req) return;
    try {
      setProcessingId(req.id);
      const response = await api_client.resolvePinResetRequest(req.id, "rejected");
      if (response.success) {
        toast.success("Request dismissed");
        setDismissTarget(null);
        fetchRequests(page);
      } else {
        toast.error(response.message || "Failed to dismiss request");
      }
    } catch {
      toast.error("Failed to dismiss request");
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

  const statusBadge = (r: PinResetRequest) => {
    switch (r.status.toLowerCase()) {
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Reset done
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Dismissed
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
            <KeyRound className="w-7 h-7 text-accent-rblue-dark" />
            Reset-PIN Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Users who forgot their login PIN. Set a new PIN and share it — they&apos;ll be
            forced to choose their own on next login.
          </p>
        </div>
        <Button onClick={() => fetchRequests(page)} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">No reset-PIN requests</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
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
                        <TableCell>{statusBadge(r)}</TableCell>
                        <TableCell>{formatDate(r.created_at)}</TableCell>
                        <TableCell className="text-right">
                          {r.status.toLowerCase() === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => { setPinTarget(r); setPinValue(""); }}
                                disabled={processingId === r.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <ShieldCheck className="w-4 h-4 mr-1" />
                                Set new PIN
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDismissTarget(r)}
                                disabled={processingId === r.id}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Dismiss
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Resolved</span>
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

      {/* Set new PIN */}
      <Dialog
        open={pinTarget !== null}
        onOpenChange={(open) => {
          if (!open && processingId === null) { setPinTarget(null); setPinValue(""); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set a new PIN</DialogTitle>
            <DialogDescription>
              Set a new login PIN for{" "}
              <span className="font-medium">{pinTarget?.name || "this user"}</span>
              {pinTarget?.phone ? ` (${pinTarget.phone})` : ""}. Share it with them — they&apos;ll
              be prompted to choose their own PIN on next login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-1">
            <Input
              autoFocus
              inputMode="numeric"
              maxLength={4}
              placeholder="New 4-digit PIN"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="tracking-[0.4em] font-mono text-center text-lg"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setPinTarget(null); setPinValue(""); }}
              disabled={processingId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetPin}
              disabled={processingId !== null || pinValue.length !== 4}
              className="bg-green-600 hover:bg-green-700"
            >
              <ShieldCheck className="w-4 h-4 mr-1" />
              {processingId !== null ? "Saving..." : "Set PIN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dismiss confirmation */}
      <Dialog
        open={dismissTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDismissTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss this request?</DialogTitle>
            <DialogDescription>
              This marks{" "}
              <span className="font-medium">{dismissTarget?.name || "the user"}</span>&apos;s
              request as resolved without changing their PIN.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissTarget(null)} disabled={processingId !== null}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDismiss} disabled={processingId !== null}>
              <XCircle className="w-4 h-4 mr-1" />
              {processingId !== null ? "Dismissing..." : "Dismiss"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
