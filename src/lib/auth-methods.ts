"use client";

import { useEffect, useState } from "react";
import { api_client, type AuthMethods, type AuthMethodsSetting } from "@/lib/api-client";

// App sign-in switches (app_settings key "auth_methods"). The admin-panel
// email/password login is NOT one of these and is never gated.

export const AUTH_METHOD_KEYS = [
  "firebase_phone",
  "whatsapp_otp",
  "sms_otp",
  "pin_login",
  "guest_login",
] as const satisfies readonly (keyof AuthMethods)[];

export type AuthMethodKey = (typeof AUTH_METHOD_KEYS)[number];

// What the server assumes when the row or a key is missing.
export const DEFAULT_AUTH_METHODS: AuthMethods = {
  firebase_phone: true,
  whatsapp_otp: false,
  sms_otp: false,
  pin_login: false,
  guest_login: false,
};

// Methods a person can actually sign in with. Guest login does not count:
// at least one of these must stay on (mirrors the server's 400 no_login_method).
export const REAL_LOGIN_METHOD_KEYS: readonly AuthMethodKey[] = [
  "firebase_phone",
  "whatsapp_otp",
  "sms_otp",
  "pin_login",
];

export const hasRealLoginMethod = (m: AuthMethods): boolean =>
  REAL_LOGIN_METHOD_KEYS.some((k) => m[k] === true);

// Fill any missing key with the server default.
export const withDefaults = (m: Partial<AuthMethods> | null | undefined): AuthMethods => {
  const out = { ...DEFAULT_AUTH_METHODS };
  if (m) {
    for (const k of AUTH_METHOD_KEYS) {
      if (typeof m[k] === "boolean") out[k] = m[k] as boolean;
    }
  }
  return out;
};

// ── "Is PIN login on?" — read once per page load, shared by every PIN tool. ──
//
// true  → PIN tools show exactly as before.
// false → PIN tools are hidden (not deleted).
// If the setting can't be read (old backend without the route, network error,
// not a super admin) we keep today's behaviour and show the PIN tools; the
// backend still enforces its own gates.
let pinLoginPromise: Promise<boolean> | null = null;

export function loadPinLoginEnabled(): Promise<boolean> {
  if (!pinLoginPromise) {
    pinLoginPromise = api_client
      .getAuthMethods()
      .then((res) => {
        if (res.success && res.data?.methods) return withDefaults(res.data.methods).pin_login;
        return true;
      })
      .catch(() => true);
  }
  return pinLoginPromise;
}

export const PIN_LOGIN_CHANGED_EVENT = "amigo:pin-login-changed";

// Called after the Login methods page saves, so PIN tools and the menu follow
// the new value without a full reload.
export function rememberAuthMethods(setting: AuthMethodsSetting): void {
  const pin = withDefaults(setting.methods).pin_login;
  pinLoginPromise = Promise.resolve(pin);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<boolean>(PIN_LOGIN_CHANGED_EVENT, { detail: pin }));
  }
}

// Subscribe to saves made on the Login methods page. Returns an unsubscribe.
export function onPinLoginChanged(cb: (enabled: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<boolean>).detail === true);
  window.addEventListener(PIN_LOGIN_CHANGED_EVENT, handler);
  return () => window.removeEventListener(PIN_LOGIN_CHANGED_EVENT, handler);
}

// null while loading. Callers hide PIN tools until this is exactly true.
export function usePinLoginEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    loadPinLoginEnabled().then((v) => {
      if (alive) setEnabled(v);
    });
    const off = onPinLoginChanged((v) => {
      if (alive) setEnabled(v);
    });
    return () => {
      alive = false;
      off();
    };
  }, []);
  return enabled;
}
