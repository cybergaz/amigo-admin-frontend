"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Flag, Trash2, Paperclip, ShieldOff, LogOut } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import {
  api_client,
  type ReportDetail,
  type ReportEvidenceMessage,
  type ReportListItem,
  type ReportPersonRef,
  type ReportStatusFilter,
} from "@/lib/api-client";
import type { ApiResponse } from "@/types/common.types";
import { toast } from "sonner";
import BouncingBalls from "@/components/ui/bouncing-balls";
import { cn } from "@/lib/utils";

const LIMIT = 20;
const NOTE_MAX = 500;

const FILTERS: { value: ReportStatusFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment: "Harassment or bullying",
  sexual: "Nudity or sexual content",
  violence: "Violence or threats",
  scam: "Scam or fraud",
  other: "Other",
};

const TYPE_LABELS: Record<string, string> = {
  user: "Person",
  message: "Message",
  group: "Group",
};

const CHAT_TYPE_LABELS: Record<string, string> = {
  dm: "Direct chat",
  group: "Group",
  community_group: "Community group",
  broadcast: "Broadcast list",
};

const DELETE_CONFIRM_COPY =
  "Delete this account? Their name, photo and number are removed and they are signed out. This can't be undone.";

// Failure bodies carry a machine code in `error` (house envelope), which the
// shared ApiResponse type does not declare.
const errorCode = (res: ApiResponse<unknown>): string | undefined =>
  (res as ApiResponse<unknown> & { error?: string }).error;

const reasonLabel = (reason: string) => REASON_LABELS[reason] ?? reason;
const typeLabel = (t: string) => TYPE_LABELS[t] ?? t;
const chatTypeLabel = (t: string) => CHAT_TYPE_LABELS[t] ?? t;

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
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

// Only plain web links become clickable; anything else (javascript:, data:)
// is shown as text.
const safeHref = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
};

const userSearchHref = (p: ReportPersonRef) => {
  const q = p.phone || p.name;
  return q ? `/dashboard?search=${encodeURIComponent(q)}` : null;
};

function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "reviewed":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Reviewed
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
          Open
        </Badge>
      );
  }
}

function PersonInline({ person }: { person: ReportPersonRef | null }) {
  if (!person) return <span className="text-muted-foreground">-</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 min-w-0">
      <span className="break-words">
        {person.name || <span className="text-muted-foreground">Unknown</span>}
      </span>
      {person.deleted && <Badge variant="destructiveLite">Deleted</Badge>}
    </span>
  );
}

function PersonBlock({ label, person }: { label: string; person: ReportPersonRef | null }) {
  const href = person ? userSearchHref(person) : null;
  return (
    <div className="rounded-lg border p-3 space-y-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      {person ? (
        <>
          <PersonInline person={person} />
          <div className="text-sm text-muted-foreground break-words">{person.phone || "No number"}</div>
          {href && (
            <Link href={href} className="text-sm text-accent-rblue-dark underline underline-offset-2">
              Find in users
            </Link>
          )}
        </>
      ) : (
        <div className="text-sm text-muted-foreground">None</div>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  sender,
  highlighted,
}: {
  msg: ReportEvidenceMessage;
  sender: string;
  highlighted?: boolean;
}) {
  const attachments = msg.attachments ?? [];
  return (
    <div
      className={cn(
        "rounded-lg border p-3 space-y-1.5 min-w-0",
        highlighted ? "border-amber-400 bg-amber-50" : "bg-muted/30",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{sender}</span>
        <span>
          {msg.type && msg.type !== "text" ? `${msg.type} · ` : ""}
          {formatDate(msg.sent_at)}
        </span>
      </div>
      {msg.body ? (
        // Plain text only. Never rendered as HTML.
        <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No text</p>
      ) : null}
      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((a, i) => {
            const href = safeHref(a.url);
            const label = a.name || a.mime || `Attachment ${i + 1}`;
            return (
              <li key={`${a.url}-${i}`} className="flex items-center gap-1.5 text-sm min-w-0">
                <Paperclip className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-rblue-dark underline underline-offset-2 break-all"
                  >
                    {label}
                  </a>
                ) : (
                  <span className="break-all text-muted-foreground">{label}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [filter, setFilter] = useState<ReportStatusFilter>("open");
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  // Detail dialog.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  // Guards against a slow detail response landing after another row was opened.
  const selectedIdRef = useRef<string | null>(null);
  // Same for the list when the filter changes quickly.
  const listSeq = useRef(0);

  const fetchReports = useCallback(async (p: number, f: ReportStatusFilter) => {
    const seq = ++listSeq.current;
    try {
      setLoading(true);
      const response = await api_client.getReports(p, LIMIT, f);
      if (seq !== listSeq.current) return;
      if (response.success && response.data) {
        setReports(response.data.reports);
        setTotalPages(response.data.pagination.totalPages || 1);
        setTotalCount(response.data.pagination.totalCount || 0);
        setPage(response.data.pagination.currentPage || p);
      } else {
        toast.error(response.message || "Failed to load reports");
      }
    } catch {
      if (seq === listSeq.current) toast.error("Failed to load reports");
    } finally {
      if (seq === listSeq.current) {
        setLoading(false);
        setLoadedOnce(true);
      }
    }
  }, []);

  useEffect(() => {
    fetchReports(1, filter);
  }, [fetchReports, filter]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api_client.getUserPermissions();
        if (res.success && res.data) setIsSuperAdmin(res.data.role === "admin");
      } catch {
        // Not a super admin as far as this page knows; Delete stays hidden.
      }
    })();
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true);
      const response = await api_client.getReport(id);
      if (selectedIdRef.current !== id) return;
      if (response.success && response.data) {
        setDetail(response.data);
      } else {
        toast.error(response.message || "Failed to load the report");
      }
    } catch {
      if (selectedIdRef.current === id) toast.error("Failed to load the report");
    } finally {
      if (selectedIdRef.current === id) setDetailLoading(false);
    }
  }, []);

  const openDetail = (id: string) => {
    selectedIdRef.current = id;
    setSelectedId(id);
    setDetail(null);
    setReviewNote("");
    loadDetail(id);
  };

  const closeDetail = () => {
    if (processing) return;
    selectedIdRef.current = null;
    setSelectedId(null);
    setDetail(null);
    setReviewNote("");
    setConfirmDeleteOpen(false);
  };

  const handleResolve = async (status: "reviewed" | "dismissed") => {
    if (!detail) return;
    try {
      setProcessing(true);
      const response = await api_client.resolveReport(detail.id, status, reviewNote);
      if (response.success) {
        toast.success(status === "reviewed" ? "Marked as reviewed" : "Report dismissed");
        setReviewNote("");
        await loadDetail(detail.id);
        fetchReports(page, filter);
      } else if (errorCode(response) === "already_closed") {
        toast.error("This report was already closed.");
        await loadDetail(detail.id);
        fetchReports(page, filter);
      } else {
        toast.error(response.message || "Failed to update the report");
      }
    } catch {
      toast.error("Failed to update the report");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    const target = detail?.reported_user;
    if (!detail || !target) return;
    try {
      setProcessing(true);
      const response = await api_client.adminDeleteAccount(target.id);
      if (response.success) {
        toast.success(`${target.name || "The account"} was deleted`);
        setConfirmDeleteOpen(false);
        await loadDetail(detail.id);
        fetchReports(page, filter);
      } else {
        const code = errorCode(response);
        if (code === "admin_cannot_delete") {
          toast.error("Admin accounts can't be deleted here.");
        } else if (code === "user_not_found") {
          toast.error("This account no longer exists.");
        } else {
          toast.error(response.message || "Failed to delete the account");
        }
        setConfirmDeleteOpen(false);
      }
    } catch {
      toast.error("Failed to delete the account");
    } finally {
      setProcessing(false);
    }
  };

  // Recent-message sender names: only the reporter and reported person are
  // known from the evidence snapshot; anyone else is "Another member".
  const senderName = (d: ReportDetail, senderId: string | null) => {
    if (senderId && d.reported_user && senderId === d.reported_user.id) {
      return d.reported_user.name || d.evidence?.reported_user?.name || "Reported person";
    }
    if (senderId && d.reporter && senderId === d.reporter.id) {
      return `${d.reporter.name || d.evidence?.reporter?.name || "Reporter"} (reporter)`;
    }
    if (senderId && d.evidence?.reported_user && senderId === d.evidence.reported_user.id) {
      return d.evidence.reported_user.name || "Reported person";
    }
    if (senderId && d.evidence?.reporter && senderId === d.evidence.reporter.id) {
      return `${d.evidence.reporter.name || "Reporter"} (reporter)`;
    }
    return "Another member";
  };

  const canDelete =
    isSuperAdmin && !!detail?.reported_user && !detail.reported_user.deleted;

  if (loading && !loadedOnce) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BouncingBalls balls={4} className="fill-black stroke-black" animation="animate-bounce-md" />
      </div>
    );
  }

  const emptyCopy =
    filter === "open" ? "No open reports" : filter === "closed" ? "No closed reports" : "No reports yet";

  const evidenceChat = detail?.evidence?.chat ?? null;
  const chatTitle = detail?.chat?.title ?? evidenceChat?.title ?? null;
  const chatType = detail?.chat?.type ?? evidenceChat?.type ?? null;
  const reportedMessage = detail?.evidence?.reported_message ?? null;
  const recentMessages = detail?.evidence?.recent_messages ?? [];

  return (
    <PageShell className="py-4 sm:py-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Flag className="w-7 h-7 shrink-0 text-accent-rblue-dark" />
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            People, messages and groups that users reported. Open a report to see what was sent.
          </p>
        </div>
        <Button onClick={() => fetchReports(page, filter)} variant="outline" className="sm:shrink-0">
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Report status">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => {
              if (filter !== f.value) {
                setReports([]);
                setTotalCount(0);
                setTotalPages(1);
                setPage(1);
                setFilter(f.value);
              }
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            loading ? (
              <div className="flex items-center justify-center py-12">
                <BouncingBalls balls={4} className="fill-black stroke-black" animation="animate-bounce-md" />
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">{emptyCopy}</p>
              </div>
            )
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((r) => (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => openDetail(r.id)}
                      >
                        <TableCell className="whitespace-nowrap">{formatDate(r.created_at)}</TableCell>
                        <TableCell>{typeLabel(r.target_type)}</TableCell>
                        <TableCell>{reasonLabel(r.reason)}</TableCell>
                        <TableCell>
                          <PersonInline person={r.reporter} />
                        </TableCell>
                        <TableCell>
                          {r.target_type === "group" ? (
                            <span className="break-words">
                              {r.chat?.title || <span className="text-muted-foreground">Group</span>}
                            </span>
                          ) : (
                            <PersonInline person={r.reported_user} />
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(r.id);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium min-w-0 break-words">
                        {typeLabel(r.target_type)} · {reasonLabel(r.reason)}
                      </span>
                      <span className="shrink-0">
                        <StatusBadge status={r.status} />
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">When</span>
                        <span className="min-w-0 break-words text-right">{formatDate(r.created_at)}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">Reporter</span>
                        <span className="min-w-0 text-right">
                          <PersonInline person={r.reporter} />
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground shrink-0">Reported</span>
                        <span className="min-w-0 text-right">
                          {r.target_type === "group" ? (
                            r.chat?.title || "Group"
                          ) : (
                            <PersonInline person={r.reported_user} />
                          )}
                        </span>
                      </div>
                    </div>
                    {r.note_preview && (
                      <p className="text-sm text-muted-foreground break-words line-clamp-2">{r.note_preview}</p>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => openDetail(r.id)}>
                      View
                    </Button>
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
                      onClick={() => fetchReports(page - 1, filter)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || loading}
                      onClick={() => fetchReports(page + 1, filter)}
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

      {/* Report detail */}
      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 pr-8">
              {detail ? (
                <>
                  {typeLabel(detail.target_type)} report
                  <StatusBadge status={detail.status} />
                </>
              ) : (
                "Report"
              )}
            </DialogTitle>
            <DialogDescription>
              {detail
                ? `${reasonLabel(detail.reason)} · reported ${formatDate(detail.created_at)}`
                : "Loading..."}
            </DialogDescription>
          </DialogHeader>

          {!detail ? (
            <div className="flex items-center justify-center py-10">
              {detailLoading ? (
                <BouncingBalls balls={4} className="fill-black stroke-black" animation="animate-bounce-md" />
              ) : (
                <p className="text-muted-foreground text-sm">Couldn&apos;t load this report.</p>
              )}
            </div>
          ) : (
            <div className="space-y-5 min-w-0">
              {/* Note */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Reporter&apos;s note</div>
                {detail.note ? (
                  <p className="text-sm whitespace-pre-wrap break-words">{detail.note}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No note</p>
                )}
              </div>

              {/* People */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PersonBlock label="Reporter" person={detail.reporter} />
                <PersonBlock label="Reported person" person={detail.reported_user} />
              </div>

              {(detail.reporter_blocked || detail.reporter_left) && (
                <div className="flex flex-wrap gap-2">
                  {detail.reporter_blocked && (
                    <Badge variant="outline">
                      <ShieldOff className="w-3 h-3 mr-1" />
                      Reporter also blocked them
                    </Badge>
                  )}
                  {detail.reporter_left && (
                    <Badge variant="outline">
                      <LogOut className="w-3 h-3 mr-1" />
                      Reporter also left the group
                    </Badge>
                  )}
                </div>
              )}

              {/* Chat */}
              {(chatTitle || chatType) && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Chat</div>
                  <p className="text-sm break-words">
                    {chatTitle || <span className="text-muted-foreground">Untitled</span>}
                    {chatType ? <span className="text-muted-foreground"> · {chatTypeLabel(chatType)}</span> : null}
                    {typeof evidenceChat?.member_count === "number" ? (
                      <span className="text-muted-foreground"> · {evidenceChat.member_count} members</span>
                    ) : null}
                  </p>
                </div>
              )}

              {/* Reported message */}
              {detail.target_type === "message" && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Reported message</div>
                  {reportedMessage ? (
                    <MessageBubble
                      msg={reportedMessage}
                      sender={senderName(detail, reportedMessage.sender_id)}
                      highlighted
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">The message wasn&apos;t captured.</p>
                  )}
                </div>
              )}

              {/* Recent messages */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Recent messages{detail.evidence?.captured_at ? ` (saved ${formatDate(detail.evidence.captured_at)})` : ""}
                </div>
                {recentMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent messages saved.</p>
                ) : (
                  <div className="space-y-2">
                    {recentMessages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        msg={m}
                        sender={senderName(detail, m.sender_id)}
                        highlighted={!!reportedMessage && m.id === reportedMessage.id}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Review */}
              {detail.status.toLowerCase() === "open" ? (
                <div className="space-y-1.5">
                  <label htmlFor="report-review-note" className="text-xs text-muted-foreground">
                    Note (optional)
                  </label>
                  <Textarea
                    id="report-review-note"
                    value={reviewNote}
                    maxLength={NOTE_MAX}
                    onChange={(e) => setReviewNote(e.target.value.slice(0, NOTE_MAX))}
                    placeholder="What did you find?"
                    disabled={processing}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {reviewNote.length}/{NOTE_MAX}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border p-3 space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Closed </span>
                    {formatDate(detail.reviewed_at)}
                    {detail.reviewed_by?.name ? (
                      <span className="text-muted-foreground"> by {detail.reviewed_by.name}</span>
                    ) : null}
                  </div>
                  {detail.review_note && (
                    <p className="whitespace-pre-wrap break-words">{detail.review_note}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {detail && (
            <DialogFooter className="gap-2 sm:justify-between">
              <div>
                {canDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={processing}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete account
                  </Button>
                )}
              </div>
              {detail.status.toLowerCase() === "open" ? (
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button variant="outline" onClick={() => handleResolve("dismissed")} disabled={processing}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Dismiss
                  </Button>
                  <Button
                    onClick={() => handleResolve("reviewed")}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {processing ? "Saving..." : "Mark reviewed"}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={closeDetail} disabled={processing}>
                  Close
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete account confirmation */}
      <Dialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          if (!open && !processing) setConfirmDeleteOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              {detail?.reported_user?.name ? (
                <span className="block font-medium text-foreground mb-1">
                  {detail.reported_user.name}
                  {detail.reported_user.phone ? ` (${detail.reported_user.phone})` : ""}
                </span>
              ) : null}
              {DELETE_CONFIRM_COPY}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={processing}>
              <Trash2 className="w-4 h-4 mr-1" />
              {processing ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
