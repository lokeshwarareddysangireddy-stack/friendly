"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { Label, Panel, Toggle, inputClass, textareaClass } from "@/components/admin/ui";
import type { SiteSettingsDoc } from "@/types";

export function SettingsForm({ initial }: { initial: SiteSettingsDoc }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    announcementEnabled: initial.announcementEnabled,
    announcementText: initial.announcementText,
    promoEnabled: initial.promoEnabled,
    promoText: initial.promoText,
    promoConditions: initial.promoConditions,
    whatsappNumber: initial.whatsappNumber,
    contactEmail: initial.contactEmail,
    supportHours: initial.supportHours,
    address: initial.address,
    freeDeliveryNote: initial.freeDeliveryNote,
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json?.ok) toast("Settings saved");
      else toast(json?.error || "Save failed", "error");
    } catch {
      toast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Panel>
        <h2 className="font-display text-lg font-extrabold text-forest">
          Announcement bar
        </h2>
        <div className="mt-4 space-y-3">
          <Toggle
            label="Show announcement bar"
            checked={form.announcementEnabled}
            onChange={(v) => set("announcementEnabled", v)}
          />
          <div>
            <Label htmlFor="s-ann">Announcement text</Label>
            <input
              id="s-ann"
              value={form.announcementText}
              onChange={(e) => set("announcementText", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <h2 className="font-display text-lg font-extrabold text-forest">
          Promo banner
        </h2>
        <div className="mt-4 space-y-3">
          <Toggle
            label="Show promo banner"
            checked={form.promoEnabled}
            onChange={(v) => set("promoEnabled", v)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-promo">Promo text</Label>
              <input
                id="s-promo"
                value={form.promoText}
                onChange={(e) => set("promoText", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="s-free">Free delivery note</Label>
              <input
                id="s-free"
                value={form.freeDeliveryNote}
                onChange={(e) => set("freeDeliveryNote", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="s-cond">Promo conditions</Label>
            <textarea
              id="s-cond"
              value={form.promoConditions}
              onChange={(e) => set("promoConditions", e.target.value)}
              rows={2}
              className={textareaClass}
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <h2 className="font-display text-lg font-extrabold text-forest">
          Contact details
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="s-wa">WhatsApp number</Label>
            <input
              id="s-wa"
              value={form.whatsappNumber}
              onChange={(e) =>
                set("whatsappNumber", e.target.value.replace(/\D/g, ""))
              }
              className={inputClass}
            />
          </div>
          <div>
            <Label htmlFor="s-email">Contact email</Label>
            <input
              id="s-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <Label htmlFor="s-hours">Support hours</Label>
            <input
              id="s-hours"
              value={form.supportHours}
              onChange={(e) => set("supportHours", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <Label htmlFor="s-addr">Service area / address</Label>
            <input
              id="s-addr"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </Panel>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save settings
        </button>
      </div>
    </div>
  );
}
