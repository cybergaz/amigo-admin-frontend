"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Info, LogIn } from "lucide-react";
import {
  api_client,
  apiErrorCode,
  type AuthMethods,
  type AuthMethodsSetting,
} from "@/lib/api-client";
import {
  AUTH_METHOD_KEYS,
  type AuthMethodKey,
  hasRealLoginMethod,
  rememberAuthMethods,
  withDefaults,
} from "@/lib/auth-methods";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageShell } from "@/components/common/page-shell";
import BouncingBalls from "@/components/ui/bouncing-balls";

const METHOD_INFO: Record<AuthMethodKey, { label: string; description: string }> = {
  firebase_phone: {
    label: "Firebase phone OTP",
    description: "Users get a code by SMS from Google Firebase and sign in or sign up with it. No PIN needed.",
  },
  whatsapp_otp: {
    label: "WhatsApp OTP",
    description: "Users get a one-time code on WhatsApp to sign in, sign up or reset their PIN.",
  },
  sms_otp: {
    label: "SMS OTP (India)",
    description: "Users get a one-time code by our own SMS provider (Indian numbers) for the same steps.",
  },
  pin_login: {
    label: "PIN login",
    description: "Users sign in with phone number + their 4-digit PIN. Also turns on PIN reset and the PIN tools in this panel.",
  },
  guest_login: {
    label: "Guest login (Android)",
    description: "The guest / test number sign-in on the Android app.",
  },
};

const errorText = (code: string | undefined, message: string | undefined, fallback: string): string => {
  switch (code) {
    case "no_login_method":
      return "At least one way to sign in must stay on (Firebase phone OTP, WhatsApp OTP, SMS OTP or PIN login).";
    case "invalid_input":
      return "The server did not accept these settings. Reload the page and try again.";
    case "forbidden":
      return "Only the super admin can change login methods.";
  }
  if (message?.startsWith("ERROR MakeRequest")) {
    return "Could not reach the server. Check your connection and try again.";
  }
  return message || fallback;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return "never";
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export default function LoginMethodsPage() {
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saved, setSaved] = useState<AuthMethodsSetting | null>(null);
  const [draft, setDraft] = useState<AuthMethods | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Source of truth for role, same as the dashboard layout.
      const perm = await api_client.getUserPermissions();
      const superAdmin = !!(perm.success && perm.data?.role === "admin");
      setIsSuperAdmin(superAdmin);
      if (!superAdmin) return;

      const res = await api_client.getAuthMethods();
      if (res.success && res.data) {
        const setting: AuthMethodsSetting = {
          methods: withDefaults(res.data.methods),
          updated_at: res.data.updated_at ?? null,
          updated_by_name: res.data.updated_by_name ?? null,
        };
        setSaved(setting);
        setDraft(setting.methods);
      } else {
        setLoadError(errorText(apiErrorCode(res), res.message, "Failed to load login methods"));
      }
    } catch (error) {
      console.error("Failed to load login methods:", error);
      setLoadError("Failed to load login methods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changes = useMemo(() => {
    if (!saved || !draft) return [] as { key: AuthMethodKey; from: boolean; to: boolean }[];
    return AUTH_METHOD_KEYS.filter((k) => saved.methods[k] !== draft[k]).map((k) => ({
      key: k,
      from: saved.methods[k],
      to: draft[k],
    }));
  }, [saved, draft]);

  const draftValid = draft ? hasRealLoginMethod(draft) : false;

  const handleSave = async () => {
    if (!draft || changes.length === 0 || !draftValid) return;
    const patch: Partial<AuthMethods> = {};
    for (const c of changes) patch[c.key] = c.to;
    try {
      setSaving(true);
      const res = await api_client.updateAuthMethods(patch);
      if (res.success && res.data) {
        const setting: AuthMethodsSetting = {
          methods: withDefaults(res.data.methods),
          updated_at: res.data.updated_at ?? null,
          updated_by_name: res.data.updated_by_name ?? null,
        };
        setSaved(setting);
        setDraft(setting.methods);
        rememberAuthMethods(setting);
        setConfirmOpen(false);
        toast.success("Login methods updated");
      } else {
        toast.error(errorText(apiErrorCode(res), res.message, "Failed to update login methods"));
      }
    } catch (error) {
      console.error("Failed to update login methods:", error);
      toast.error("Failed to update login methods");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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

  if (loadError || !saved || !draft) {
    return (
      <PageShell className="max-w-2xl py-4 sm:py-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-accent-gray">{loadError ?? "Failed to load login methods"}</p>
            <Button variant="outline" onClick={load}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const firebaseTurningOff = changes.some((c) => c.key === "firebase_phone" && !c.to);
  const pinTurningOn = changes.some((c) => c.key === "pin_login" && c.to);

  return (
    <PageShell className="max-w-2xl py-4 sm:py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5" />
            Login Methods
          </CardTitle>
          <CardDescription>
            Choose how people sign in to the Amigo app. A method that is off is hidden in the app,
            and older app versions that try it are told to update. Turning a method back on brings
            it back exactly as it was.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This only affects the app. Signing in to this admin panel with email and password is
              never affected by these switches.
            </span>
          </div>

          {AUTH_METHOD_KEYS.map((key) => {
            const on = draft[key];
            const info = METHOD_INFO[key];
            const id = `auth-method-${key}`;
            return (
              <div key={key} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div className="flex flex-col min-w-0">
                  <span id={id} className="font-medium">
                    {info.label}
                  </span>
                  <span className="text-sm text-accent-gray">{info.description}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-labelledby={id}
                  disabled={saving}
                  onClick={() => setDraft((d) => (d ? { ...d, [key]: !d[key] } : d))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] ${
                    on ? "bg-accent-rblue-dark" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      on ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}

          {!draftValid && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Keep at least one way to sign in on: Firebase phone OTP, WhatsApp OTP, SMS OTP or PIN
                login. Guest login alone is not enough.
              </span>
            </div>
          )}

          <p className="text-xs text-accent-gray">
            Last changed: {formatDate(saved.updated_at)}
            {saved.updated_by_name ? ` by ${saved.updated_by_name}` : ""}
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDraft(saved.methods)}
              disabled={saving || changes.length === 0}
            >
              Undo changes
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={saving || changes.length === 0 || !draftValid}
            >
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!saving) setConfirmOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change how people sign in?</DialogTitle>
            <DialogDescription>
              This takes effect for everyone within about a minute. People who are already signed in
              stay signed in.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            {changes.map((c) => (
              <li key={c.key} className="flex justify-between gap-3">
                <span className="font-medium">{METHOD_INFO[c.key].label}</span>
                <span className={c.to ? "text-green-700" : "text-red-700"}>
                  {c.to ? "Turn on" : "Turn off"}
                </span>
              </li>
            ))}
          </ul>
          {firebaseTurningOff && (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
              With Firebase phone OTP off, the app goes back to its older sign-in screen, showing
              only the methods that are on.
            </p>
          )}
          {pinTurningOn && (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
              Users who signed up without a PIN have none yet; they will need a PIN reset before
              they can use PIN login. Users created here while PIN login was off have a random PIN
              they do not know. The app will ask them to choose their own, or you can set one for
              them in Users.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Yes, save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
