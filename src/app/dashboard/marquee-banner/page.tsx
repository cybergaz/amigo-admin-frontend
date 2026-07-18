"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";
import { api_client } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/common/page-shell";
import BouncingBalls from "@/components/ui/bouncing-balls";

export default function MarqueeBannerPage() {
  const [text, setText] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Source of truth for role, same as the dashboard layout.
        const perm = await api_client.getUserPermissions();
        const superAdmin = !!(perm.success && perm.data?.role === "admin");
        setIsSuperAdmin(superAdmin);

        if (superAdmin) {
          const res = await api_client.getMarqueeBanner();
          if (res.success && res.data) {
            setText(res.data.text ?? "");
            setEnabled(res.data.enabled ?? false);
          }
        }
      } catch (error) {
        console.error("Failed to load marquee banner:", error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api_client.updateMarqueeBanner(text.trim(), enabled);
      if (res.success) {
        setText(res.data?.text ?? text.trim());
        setEnabled(res.data?.enabled ?? enabled);
        toast.success("Marquee banner updated");
      } else {
        toast.error(res.message || "Failed to update marquee banner");
      }
    } catch (error) {
      console.error("Failed to update marquee banner:", error);
      toast.error("Failed to update marquee banner");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BouncingBalls
          balls={4}
          className="fill-black stroke-black"
          animation="animate-bounce-md"
        />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-accent-gray">
          Access denied. This page is restricted to the super admin.
        </p>
      </div>
    );
  }

  return (
    <PageShell className="max-w-2xl py-4 sm:py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Marquee Banner
          </CardTitle>
          <CardDescription>
            This one-line banner scrolls below the search bar on the app&apos;s
            group list for all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="marquee-text">Banner text</Label>
            <Textarea
              id="marquee-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Welcome to Amigo! Tap a group to start chatting."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="flex flex-col min-w-0">
              <span className="font-medium">Show banner</span>
              <span className="text-sm text-accent-gray">
                When off, the banner is hidden in the app even if text is set.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] ${
                enabled ? "bg-accent-rblue-dark" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  enabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
