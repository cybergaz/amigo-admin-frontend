"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Crown, RotateCcw, Search, Trash2, UserX } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import {
  api_client,
  apiErrorCode,
  type DeletedAccount,
  type DeletedAccountDetail,
} from "@/lib/api-client";
import {
  ERASE_COPY,
  deletedByLabel,
  eraseErrorMessage,
  formatDateTime,
  loadErrorMessage,
  restoreErrorMessage,
} from "@/lib/account-restore";
import { toast } from "sonner";
import BouncingBalls from "@/components/ui/bouncing-balls";

const LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 350;

const displayName = (a: { name: string | null; snapshot_name?: string | null }) =>
  a.name || a.snapshot_name || null;

export default function DeletedAccountsPage() {
  const [items, setItems] = useState<DeletedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Detail dialog.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DeletedAccountDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const selectedIdRef = useRef<string | null>(null);

  // Restore confirmation.
  const [restoreTarget, setRestoreTarget] = useState<DeletedAccount | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Erase permanently (super admin, from the detail dialog). Cannot be undone.
  const [eraseTarget, setEraseTarget] = useState<DeletedAccountDetail | null>(null);
  const [erasing, setErasing] = useState(false);
  const busy = restoring || erasing;

  const listSeq = useRef(0);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchItems = useCallback(async (p: number, q: string) => {
    const seq = ++listSeq.current;
    try {
      setLoading(true);
      const response = await api_client.getDeletedAccounts(p, LIMIT, q);
      if (seq !== listSeq.current) return;
      if (response.success && response.data) {
        setItems(response.data.items ?? []);
        setTotal(response.data.total ?? 0);
        setPage(p);
      } else {
        toast.error(loadErrorMessage(apiErrorCode(response), response.message, "Failed to load deleted accounts"));
      }
    } catch {
      if (seq === listSeq.current) toast.error("Failed to load deleted accounts");
    } finally {
      if (seq === listSeq.current) {
        setLoading(false);
        setLoadedOnce(true);
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchItems(1, search);
  }, [fetchItems, search]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api_client.getUserPermissions();
        if (res.success && res.data) setIsSuperAdmin(res.data.role === "admin");
      } catch {
        // Restore stays hidden.
      }
    })();
  }, []);

  const loadDetail = useCallback(async (userId: string) => {
    try {
      setDetailLoading(true);
      const response = await api_client.getDeletedAccount(userId);
      if (selectedIdRef.current !== userId) return;
      if (response.success && response.data) {
        setDetail(response.data);
      } else {
        toast.error(loadErrorMessage(apiErrorCode(response), response.message, "Failed to load the account"));
      }
    } catch {
      if (selectedIdRef.current === userId) toast.error("Failed to load the account");
    } finally {
      if (selectedIdRef.current === userId) setDetailLoading(false);
    }
  }, []);

  const openDetail = (userId: string) => {
    selectedIdRef.current = userId;
    setSelectedId(userId);
    setDetail(null);
    loadDetail(userId);
  };

  const closeDetail = () => {
    if (busy) return;
    selectedIdRef.current = null;
    setSelectedId(null);
    setDetail(null);
  };

  const handleRestore = async () => {
    const target = restoreTarget;
    if (!target) return;
    try {
      setRestoring(true);
      const response = await api_client.restoreAccount(target.user_id);
      if (response.success) {
        toast.success(`${displayName(target) || "The account"} was restored. They can log in again with a code.`);
        setRestoreTarget(null);
        if (selectedIdRef.current === target.user_id) {
          selectedIdRef.current = null;
          setSelectedId(null);
          setDetail(null);
        }
        // The row leaves the list; step back if it was the last one on this page.
        fetchItems(items.length === 1 && page > 1 ? page - 1 : page, search);
      } else {
        toast.error(restoreErrorMessage(apiErrorCode(response), response.message));
        setRestoreTarget(null);
      }
    } catch {
      toast.error("Failed to restore the account");
    } finally {
      setRestoring(false);
    }
  };

  // Hard erase (DELETE /admin/delete-user/:id): the only way to remove a
  // deleted account for good, since the users list shows live accounts only.
  const handleErase = async () => {
    const target = eraseTarget;
    if (!target) return;
    try {
      setErasing(true);
      const response = await api_client.deleteUser(target.user_id);
      if (response.success) {
        toast.success(`${displayName(target) || "The account"} was permanently erased.`);
        setEraseTarget(null);
        if (selectedIdRef.current === target.user_id) {
          selectedIdRef.current = null;
          setSelectedId(null);
          setDetail(null);
        }
        fetchItems(items.length === 1 && page > 1 ? page - 1 : page, search);
      } else {
        toast.error(eraseErrorMessage(apiErrorCode(response), response.message));
        setEraseTarget(null);
      }
    } catch {
      toast.error("Failed to erase the account");
    } finally {
      setErasing(false);
    }
  };

  if (loading && !loadedOnce) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BouncingBalls balls={4} className="fill-black stroke-black" animation="animate-bounce-md" />
      </div>
    );
  }

  const nameCell = (a: DeletedAccount) =>
    displayName(a) || <span className="text-muted-foreground">Unknown</span>;

  return (
    <PageShell className="py-4 sm:py-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <UserX className="w-7 h-7 shrink-0 text-accent-rblue-dark" />
            Deleted Accounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Accounts that were deleted. Their messages and groups are kept; others see them as
            &quot;Deleted account&quot;.{isSuperAdmin ? " You can restore an account, or erase it for good from its details." : ""}
          </p>
        </div>
        <Button onClick={() => fetchItems(page, search)} variant="outline" className="sm:shrink-0">
          Refresh
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or number"
          className="pl-9"
          aria-label="Search deleted accounts"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deleted accounts ({total})</CardTitle>
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
                <p className="text-muted-foreground">
                  {search ? "No deleted accounts match your search" : "No deleted accounts"}
                </p>
              </div>
            )
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Deleted</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead className="text-right">Groups</TableHead>
                      <TableHead className="text-right">Messages</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((a) => (
                      <TableRow key={a.user_id} className="cursor-pointer" onClick={() => openDetail(a.user_id)}>
                        <TableCell className="font-medium">{nameCell(a)}</TableCell>
                        <TableCell>{a.phone || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDateTime(a.deleted_at)}</TableCell>
                        <TableCell>{deletedByLabel(a.by)}</TableCell>
                        <TableCell className="text-right">{a.groups_count ?? 0}</TableCell>
                        <TableCell className="text-right">{a.messages_count ?? 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(a.user_id);
                              }}
                            >
                              View
                            </Button>
                            {isSuperAdmin && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRestoreTarget(a);
                                }}
                                disabled={busy}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Restore
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {items.map((a) => (
                  <div key={a.user_id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium min-w-0 break-words">{nameCell(a)}</span>
                      <Badge variant="destructiveLite" className="shrink-0">Deleted</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">Phone</span>
                        <span className="min-w-0 break-words text-right">{a.phone || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">Deleted</span>
                        <span className="min-w-0 break-words text-right">{formatDateTime(a.deleted_at)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">By</span>
                        <span className="min-w-0 break-words text-right">{deletedByLabel(a.by)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">Groups / messages</span>
                        <span className="min-w-0 text-right">
                          {a.groups_count ?? 0} / {a.messages_count ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" className="w-full" onClick={() => openDetail(a.user_id)}>
                        View
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          onClick={() => setRestoreTarget(a)}
                          disabled={busy}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restore
                        </Button>
                      )}
                    </div>
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
                      onClick={() => fetchItems(page - 1, search)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => fetchItems(page + 1, search)}
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

      {/* Detail */}
      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 pr-8">
              <span className="break-words">{detail ? displayName(detail) || "Unknown" : "Deleted account"}</span>
              <Badge variant="destructiveLite">Deleted</Badge>
            </DialogTitle>
            <DialogDescription>
              {detail
                ? `Deleted ${formatDateTime(detail.deleted_at)} by ${deletedByLabel(detail.by).toLowerCase()}`
                : "Loading..."}
            </DialogDescription>
          </DialogHeader>

          {!detail ? (
            <div className="flex items-center justify-center py-10">
              {detailLoading ? (
                <BouncingBalls balls={4} className="fill-black stroke-black" animation="animate-bounce-md" />
              ) : (
                <p className="text-muted-foreground text-sm">Couldn&apos;t load this account.</p>
              )}
            </div>
          ) : (
            <div className="space-y-5 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3 space-y-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="break-all">{detail.phone || "-"}</div>
                </div>
                <div className="rounded-lg border p-3 space-y-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Messages sent</div>
                  <div>{detail.messages_count ?? 0}</div>
                </div>
                <div className="rounded-lg border p-3 space-y-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Last message</div>
                  <div>{formatDateTime(detail.last_messages_at)}</div>
                </div>
                <div className="rounded-lg border p-3 space-y-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Groups</div>
                  <div>{detail.groups_count ?? detail.groups?.length ?? 0}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Groups (still a member, shown as &quot;Deleted account&quot;)
                </div>
                {(detail.groups ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Not in any group.</p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {detail.groups.map((g) => (
                      <li key={g.chat_id} className="flex items-center justify-between gap-3 p-3 text-sm min-w-0">
                        <span className="min-w-0 break-words">
                          {g.name || <span className="text-muted-foreground">Untitled group</span>}
                          {g.is_owner_before && (
                            <Badge variant="outline" className="ml-2">
                              <Crown className="w-3 h-3" />
                              Was owner
                            </Badge>
                          )}
                        </span>
                        <span className="shrink-0 text-muted-foreground">{g.members_count} members</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDetail} disabled={busy}>
              Close
            </Button>
            {detail && isSuperAdmin && (
              <Button
                variant="destructive"
                onClick={() => setEraseTarget(detail)}
                disabled={busy}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Erase permanently...
              </Button>
            )}
            {detail && isSuperAdmin && (
              <Button
                onClick={() => setRestoreTarget(detail)}
                disabled={busy}
                className="bg-green-600 hover:bg-green-700"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Restore
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore confirmation */}
      <Dialog
        open={restoreTarget !== null}
        onOpenChange={(open) => {
          if (!open && !restoring) setRestoreTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore this account?</DialogTitle>
            <DialogDescription>
              <span className="block font-medium text-foreground mb-1">
                {restoreTarget ? displayName(restoreTarget) || "Unknown" : ""}
                {restoreTarget?.phone ? ` (${restoreTarget.phone})` : ""}
              </span>
              Their name and photo come back for everyone and they can log in again with a code
              sent to this number. Groups they owned before are not given back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreTarget(null)} disabled={restoring}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoring} className="bg-green-600 hover:bg-green-700">
              <RotateCcw className="w-4 h-4 mr-1" />
              {restoring ? "Restoring..." : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Erase permanently confirmation */}
      <Dialog
        open={eraseTarget !== null}
        onOpenChange={(open) => {
          if (!open && !erasing) setEraseTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Erase permanently?
            </DialogTitle>
            <DialogDescription>
              <span className="block font-medium text-foreground mb-1 break-words">
                {eraseTarget ? displayName(eraseTarget) || "Unknown" : ""}
                {eraseTarget?.phone ? ` (${eraseTarget.phone})` : ""}
              </span>
              {ERASE_COPY}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
            <p className="text-red-700 font-semibold mb-2">This cannot be undone.</p>
            <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
              <li>The user is removed from the database with all their data</li>
              <li>The account can never be restored</li>
              <li>Choose &quot;Restore&quot; or leave it deleted if you might need it back</li>
            </ul>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setEraseTarget(null)}
              disabled={erasing}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleErase}
              disabled={erasing}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 font-bold"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {erasing ? "Erasing..." : "Erase permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
