// Shared wording for the reversible account delete, restore and recovery
// requests (users list, Reports, Deleted accounts, Recovery requests).

export const DELETE_RESTORABLE_COPY =
  "They are signed out everywhere and can't log in or sign up with this number. Everyone else sees \"Deleted account\" with no photo. Their messages, groups and lists are kept, and a super admin can restore the account later.";

export const ERASE_COPY =
  "Removes the user and all their data from the database. This cannot be undone and the account can never be restored.";

// Codes every account route can answer with. The backend sends the bare code
// as `message` when it has no wording, so a raw code must never reach a toast.
const COMMON_ERRORS: Record<string, string> = {
  server_error: "Something went wrong on the server. Please try again.",
  invalid_id: "This id isn't valid.",
  invalid_status: "This filter isn't valid.",
  request_not_found: "This request no longer exists.",
};

const DELETE_ERRORS: Record<string, string> = {
  ...COMMON_ERRORS,
  forbidden: "Only the super admin can delete accounts.",
  admin_cannot_delete: "Admin accounts can't be deleted here.",
  user_not_found: "This account no longer exists.",
  already_deleted: "This account is already deleted.",
};

const RESTORE_ERRORS: Record<string, string> = {
  ...COMMON_ERRORS,
  forbidden: "Only the super admin can restore accounts.",
  not_deleted: "This account isn't deleted any more.",
  no_snapshot: "This account was deleted the old way and can't be restored.",
  bad_snapshot: "This account's saved details can't be read, so it can't be restored.",
  phone_in_use: "Another account now uses this number, so it can't be restored.",
  user_not_found: "This account no longer exists.",
  not_found: "This request no longer exists.",
  not_pending: "This request was already handled.",
  already_resolved: "This request was already handled.",
  no_account: "No deleted account matches this request.",
};

// Mapped code first, then the server wording unless it is just the raw code
// again, then the generic text.
const pickMessage = (
  map: Record<string, string>,
  code: string | undefined,
  message: string | undefined,
  generic: string,
) => (code && map[code]) || (message && message !== code ? message : "") || generic;

export const deleteErrorMessage = (code: string | undefined, fallback?: string) =>
  pickMessage(DELETE_ERRORS, code, fallback, "Failed to delete the account");

export const restoreErrorMessage = (code: string | undefined, fallback?: string, generic = "Failed to restore the account") =>
  pickMessage(RESTORE_ERRORS, code, fallback, generic);

// List / detail loads on the Deleted accounts and Recovery requests pages.
export const loadErrorMessage = (code: string | undefined, message: string | undefined, generic: string) =>
  pickMessage(COMMON_ERRORS, code, message, generic);

// Hard erase (DELETE /admin/delete-user/:id) answers with plain wording only.
export const eraseErrorMessage = (code: string | undefined, message: string | undefined) =>
  pickMessage(COMMON_ERRORS, code, message, "Failed to erase the account");

export const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const deletedByLabel = (by: string | null | undefined) =>
  by === "self" ? "Themselves" : by === "admin" ? "An admin" : by || "-";
