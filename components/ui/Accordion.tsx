"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-surface"
            >
              <span className="font-display text-base font-bold text-forest">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-deep transition-transform duration-300",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
