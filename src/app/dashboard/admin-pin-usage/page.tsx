"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, ShieldAlert, Smartphone } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { api_client, type AdminPinEvent } from "@/lib/api-client";
import { toast } from "sonner";
import BouncingBalls from "@/components/ui/bouncing-balls";

const LIMIT = 20;

export default function AdminPinUsage() {
  const [events, setEvents] = useState<AdminPinEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [confirmEvent, setConfirmEvent] = useState<AdminPinEvent | null>(null);

  const fetchEvents = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const response = await api_client.getAdminPinEvents(p, LIMIT);
      if (response.success && response.data) {
        setEvents(response.data.events);
        setTotalPages(response.data.pagination.totalPages || 1);
        setTotalCount(response.data.pagination.totalCount || 0);
        setPage(response.data.pagination.currentPage || p);
      } else {
        toast.error(response.message || "Failed to fetch admin PIN usage");
      }
    } catch {
      toast.error("Failed to fetch admin PIN usage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  const handleResolveConfirm = async () => {
    const event = confirmEvent;
    if (!event) return;
    try {
      setProcessingId(event.id);
      const response = await api_client.resolveAdminPinEvent(event.id);
      if (response.success) {
        toast.success("Entry resolved");
        setConfirmEvent(null);
        // Refetch the current page (fall back a page if it was the last row).
        const nextPage = events.length === 1 && page > 1 ? page - 1 : page;
        fetchEvents(nextPage);
      } else {
        toast.error(response.message || "Failed to resolve entry");
      }
    } catch {
      toast.error("Failed to resolve entry");
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

  const deviceLabel = (event: AdminPinEvent) => {
    const parts: string[] = [];
    if (event.device_name) parts.push(event.device_name);
    if (event.platform) parts.push(`(${event.platform})`);
    return parts.length ? parts.join(" ") : "-";
  };

  if (loading && events.length === 0) {
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
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 shrink-0 text-red-600" />
            Admin PIN Usage
          </h1>
          <p className="text-muted-foreground mt-1">
            Every time a user unlocked the app with their Admin PIN. Resolve an entry once handled.
          </p>
        </div>
        <Button onClick={() => fetchEvents(page)} variant="outline" className="sm:shrink-0">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage History ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">No Admin PIN usage recorded</p>
            </div>
          ) : (
            <>
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          {event.name || <span className="text-muted-foreground">Unknown</span>}
                        </TableCell>
                        <TableCell>{event.phone || "-"}</TableCell>
                        <TableCell className="max-w-[12ch] xl:max-w-[22ch]">
                          <span
                            className="block truncate text-xs font-mono text-muted-foreground"
                            title={event.user_id}
                          >
                            {event.user_id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="font-normal max-w-[16ch] xl:max-w-[28ch]"
                            title={deviceLabel(event)}
                          >
                            <Smartphone className="w-3 h-3 mr-1 shrink-0" />
                            <span className="truncate">{deviceLabel(event)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(event.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setConfirmEvent(event)}
                            disabled={processingId === event.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {processingId === event.id ? "Resolving..." : "Resolve"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

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
                      onClick={() => fetchEvents(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => fetchEvents(page + 1)}
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

      {/* Resolve confirmation */}
      <Dialog
        open={confirmEvent !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmEvent(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve this entry?</DialogTitle>
            <DialogDescription>
              This permanently removes the Admin PIN usage by{" "}
              <span className="font-medium">{confirmEvent?.name || "Unknown"}</span>
              {confirmEvent?.phone ? ` (${confirmEvent.phone})` : ""} from the history. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmEvent(null)}
              disabled={processingId !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveConfirm}
              disabled={processingId !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {processingId !== null ? "Resolving..." : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
