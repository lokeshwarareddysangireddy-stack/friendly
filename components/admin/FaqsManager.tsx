"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  DangerButton,
  Label,
  Panel,
  Toggle,
  inputClass,
  textareaClass,
} from "@/components/admin/ui";
import type { FAQDoc } from "@/types";

interface FormState {
  _id?: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: string;
  active: boolean;
}

const EMPTY: FormState = {
  question: "",
  answer: "",
  category: "General",
  sortOrder: "0",
  active: true,
};

export function FaqsManager({ initialItems }: { initialItems: FAQDoc[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/faqs");
    const json = await res.json();
    if (json?.ok) setItems(json.data.items);
  };

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const save = async () => {
    if (!form) return;
    if (form.question.trim().length < 4 || form.answer.trim().length < 4) {
      toast("Enter a question and answer", "error");
      return;
    }
    setSaving(true);
    const payload = {
      question: form.question,
      answer: form.answer,
      category: form.category,
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    };
    try {
      const res = await fetch(
        form._id ? `/api/admin/faqs/${form._id}` : "/api/admin/faqs",
        {
          method: form._id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (json?.ok) {
        toast(form._id ? "FAQ updated" : "FAQ created");
        setForm(null);
        load();
      } else toast(json?.error || "Save failed", "error");
    } catch {
      toast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (f: FAQDoc) => {
    if (!window.confirm("Delete this FAQ?")) return;
    const res = await fetch(`/api/admin/faqs/${f._id}`, { method: "DELETE" });
    const json = await res.json();
    if (json?.ok) {
      toast("FAQ deleted");
      load();
    } else toast(json?.error || "Delete failed", "error");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-3">
        {items.map((f) => (
          <div key={f._id} className="rounded-3xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-forest">{f.question}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{f.answer}</p>
                <p className="mt-1 text-xs text-muted">
                  {f.category} · sort {f.sortOrder}
                  {!f.active && " · inactive"}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      _id: f._id,
                      question: f.question,
                      answer: f.answer,
                      category: f.category || "General",
                      sortOrder: String(f.sortOrder),
                      active: f.active,
                    })
                  }
                  aria-label="Edit FAQ"
                  className="rounded-full p-2 text-muted transition hover:bg-pale hover:text-forest"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <DangerButton onClick={() => remove(f)}>
                  <Trash2 className="h-4 w-4" />
                </DangerButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="lg:sticky lg:top-6 lg:h-fit">
        {form ? (
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold text-forest">
                {form._id ? "Edit FAQ" : "New FAQ"}
              </h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                aria-label="Close form"
                className="rounded-full p-1.5 text-muted hover:bg-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="f-q">Question</Label>
                <input
                  id="f-q"
                  value={form.question}
                  onChange={(e) => set("question", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <Label htmlFor="f-a">Answer</Label>
                <textarea
                  id="f-a"
                  value={form.answer}
                  onChange={(e) => set("answer", e.target.value)}
                  rows={4}
                  className={textareaClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="f-cat">Category</Label>
                  <input
                    id="f-cat"
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label htmlFor="f-sort">Sort order</Label>
                  <input
                    id="f-sort"
                    value={form.sortOrder}
                    inputMode="numeric"
                    onChange={(e) =>
                      set("sortOrder", e.target.value.replace(/\D/g, ""))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <Toggle
                label="Active"
                checked={form.active}
                onChange={(v) => set("active", v)}
              />
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {form._id ? "Save changes" : "Create FAQ"}
              </button>
            </div>
          </Panel>
        ) : (
          <Panel>
            <h2 className="font-display text-lg font-extrabold text-forest">
              Add an FAQ
            </h2>
            <p className="mt-1 text-sm text-muted">
              FAQs appear on the home, FAQ and about pages.
            </p>
            <button
              type="button"
              onClick={() => setForm({ ...EMPTY })}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              New FAQ
            </button>
          </Panel>
        )}
      </div>
    </div>
  );
}
