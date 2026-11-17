"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Clock, LifeBuoy, RotateCcw, XCircle } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import {
  api_client,
  apiErrorCode,
  type RecoveryRequest,
  type RecoveryRequestStatus,
} from "@/lib/api-client";
import { formatDateTime, loadErrorMessage, restoreErrorMessage } from "@/lib/account-restore";
import { toast } from "sonner";
import BouncingBalls from "@/components/ui/bouncing-balls";

const LIMIT = 20;

const TABS: { value: RecoveryRequestStatus; label: string; empty: string }[] = [
  { value: "pending", label: "Pending", empty: "No pending recovery requests" },
  { value: "restored", label: "Restored", empty: "No restored requests" },
  { value: "dismissed", label: "Dismissed", empty: "No dismissed requests" },
];

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "restored":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Restored
        </Badge>
      );
    case "dismissed":
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
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
}

function AccountCell({ r }: { r: RecoveryRequest }) {
  if (!r.user_id) return <span className="text-muted-foreground">No deleted account found</span>;
  return <span className="break-words">{r.account_name || <span className="text-muted-foreground">Unknown</span>}</span>;
}

export default function RecoveryRequestsPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [tab, setTab] = useState<RecoveryRequestStatus>("pending");
  const [items, setItems] = useState<RecoveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [restoreTarget, setRestoreTarget] = useState<RecoveryRequest | null>(null);
  const [dismissTarget, setDismissTarget] = useState<RecoveryRequest | null>(null);

  const listSeq = useRef(0);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    (async () => {
      try {
        // Source of truth for role, same as the dashboard layout.
        const perm = await api_client.getUserPermissions();
        setIsSuperAdmin(!!(perm.success && perm.data?.role === "admin"));
      } catch {
        setIsSuperAdmin(false);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  const fetchItems = useCallback(async (p: number, status: RecoveryRequestStatus) => {
    const seq = ++listSeq.current;
    try {
      setLoading(true);
      const response = await api_client.getRecoveryRequests(status, p, LIMIT);
      if (seq !== listSeq.current) return;
      if (response.success && response.data) {
        setItems(response.data.items ?? []);
        setTotal(response.data.total ?? 0);
        setPage(p);
      } else {
        toast.error(loadErrorMessage(apiErrorCode(response), response.message, "Failed to load recovery requests"));
      }
    } catch {
      if (seq === listSeq.current) toast.error("Failed to load recovery requests");
    } finally {
      if (seq === listSeq.current) {
        setLoading(false);
        setLoadedOnce(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) fetchItems(1, tab);
  }, [isSuperAdmin, fetchItems, tab]);

  // The handled row leaves the pending list; step back if it was the last one.
  const refreshAfterAction = () =>
    fetchItems(items.length === 1 && page > 1 ? page - 1 : page, tab);

  const handleRestore = async () => {
    const r = restoreTarget;
    if (!r) return;
    try {
      setProcessingId(r.id);
      const response = await api_client.restoreRecoveryRequest(r.id);
      if (response.success) {
        toast.success(`${r.account_name || r.name || "The account"} was restored. They can log in again with a code.`);
        setRestoreTarget(null);
        refreshAfterAction();
      } else {
        toast.error(restoreErrorMessage(apiErrorCode(response), response.message));
        setRestoreTarget(null);
        refreshAfterAction();
      }
    } catch {
      toast.error("Failed to restore the account");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async () => {
    const r = dismissTarget;
    if (!r) return;
    try {
      setProcessingId(r.id);
      const response = await api_client.dismissRecoveryRequest(r.id);
      if (response.success) {
        toast.success("Request dismissed. The account stays deleted.");
        setDismissTarget(null);
        refreshAfterAction();
      } else {
        toast.error(restoreErrorMessage(apiErrorCode(response), response.message, "Failed to dismiss the request"));
        setDismissTarget(null);
      }
    } catch {
      toast.error("Failed to dismiss the request");
    } finally {
      setProcessingId(null);
    }
  };

  if (!authChecked || (isSuperAdmin && !loadedOnce)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BouncingBalls balls={4} className="fill-black stroke-black" animation="animate-bounce-md" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-accent-gray">Access denied. This page is restricted to the super admin.</p>
      </div>
    );
  }

  const current = TABS.find((t) => t.value === tab) ?? TABS[0];

  const actions = (r: RecoveryRequest, full = false) =>
    r.status.toLowerCase() === "pending" ? (
      <div className={full ? "flex flex-col gap-2" : "flex justify-end gap-2"}>
        <Button
          size={full ? "default" : "sm"}
          onClick={() => setRestoreTarget(r)}
          disabled={processingId === r.id || !r.user_id}
          title={r.user_id ? undefined : "No deleted account matches this number"}
          className={(full ? "w-full " : "") + "bg-green-600 hover:bg-green-700"}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Restore
        </Button>
        <Button
          size={full ? "default" : "sm"}
          variant="outline"
          onClick={() => setDismissTarget(r)}
          disabled={processingId === r.id}
          className={full ? "w-full" : undefined}
        >
          <XCircle className="w-4 h-4 mr-1" />
          Dismiss
        </Button>
      </div>
    ) : (
      <span className="text-xs text-muted-foreground">Handled {formatDateTime(r.resolved_at)}</span>
    );

  return (
    <PageShell className="py-4 sm:py-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 shrink-0 text-accent-rblue-dark" />
            Recovery Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            People asking to get a deleted account back. Compare the name they typed with the
            account&apos;s name before restoring. They still need a code sent to the number to log in.
          </p>
        </div>
        <Button onClick={() => fetchItems(page, tab)} variant="outline" className="sm:shrink-0">
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Request status">
        {TABS.map((t) => (
          <Button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            size="sm"
            variant={tab === t.value ? "default" : "outline"}
            onClick={() => {
              if (tab !== t.value) {
                setItems([]);
                setTotal(0);
                setPage(1);
                setTab(t.value);
              }
            }}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {current.label} ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            loading ? (
              <div className="flex items-center justify-center py-12">
                <BouncingBalls balls={4} className="fill-black stroke-black" animation="animate-bounce-md" />
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">{current.empty}</p>
              </div>
            )
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Name given</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Account name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">{formatDateTime(r.created_at)}</TableCell>
                        <TableCell className="font-medium break-words">{r.name}</TableCell>
                        <TableCell>{r.phone}</TableCell>
                        <TableCell>
                          <AccountCell r={r} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-right">{actions(r)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {items.map((r) => (
                  <div key={r.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium min-w-0 break-words">{r.name}</span>
                      <span className="shrink-0">
                        <StatusBadge status={r.status} />
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">Number</span>
                        <span className="min-w-0 break-words text-right">{r.phone}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">Account name</span>
                        <span className="min-w-0 text-right">
                          <AccountCell r={r} />
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">When</span>
                        <span className="min-w-0 break-words text-right">{formatDateTime(r.created_at)}</span>
                      </div>
                    </div>
                    {actions(r, true)}
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || loading}
                      onClick={() => fetchItems(page - 1, tab)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => fetchItems(page + 1, tab)}
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

      {/* Restore confirmation */}
      <Dialog
        open={restoreTarget !== null}
        onOpenChange={(open) => {
          if (!open && processingId === null) setRestoreTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore this account?</DialogTitle>
            <DialogDescription>
              Check that the person is the owner of the account. Their name and photo come back for
              everyone and they can log in again with a code sent to this number.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3 space-y-1 min-w-0">
              <div className="text-xs text-muted-foreground">Name they typed</div>
              <div className="font-medium break-words">{restoreTarget?.name}</div>
            </div>
            <div className="rounded-lg border p-3 space-y-1 min-w-0">
              <div className="text-xs text-muted-foreground">Account name</div>
              <div className="font-medium break-words">{restoreTarget?.account_name || "Unknown"}</div>
            </div>
            <div className="rounded-lg border p-3 space-y-1 min-w-0 sm:col-span-2">
              <div className="text-xs text-muted-foreground">Number</div>
              <div className="break-all">{restoreTarget?.phone}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)} disabled={processingId !== null}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={processingId !== null} className="bg-green-600 hover:bg-green-700">
              <RotateCcw className="w-4 h-4 mr-1" />
              {processingId !== null ? "Restoring..." : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dismiss confirmation */}
      <Dialog
        open={dismissTarget !== null}
        onOpenChange={(open) => {
          if (!open && processingId === null) setDismissTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss this request?</DialogTitle>
            <DialogDescription>
              The request from <span className="font-medium">{dismissTarget?.name}</span>
              {dismissTarget?.phone ? ` (${dismissTarget.phone})` : ""} is closed and the account stays
              deleted. They can send a new request later.
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
    </PageShell>
  );
}
