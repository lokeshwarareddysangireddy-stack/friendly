"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Loader2, ShieldX } from "lucide-react";
import { AuthShell, Link } from "@/components/auth/auth-ui";
import { useCustomer } from "@/components/auth/customer-context";

function VerifyInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { refresh } = useCustomer();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  const run = useCallback(async () => {
    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (json?.ok) {
        setState("ok");
        await refresh();
      } else {
        setState("error");
        setMessage(json?.error || "We could not verify this link.");
      }
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  }, [token, refresh]);

  useEffect(() => {
    void run();
  }, [run]);

  if (state === "loading") {
    return (
      <AuthShell title="Verifying your email" icon={Loader2}>
        <div className="flex items-center gap-3 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Please wait a moment…
        </div>
      </AuthShell>
    );
  }

  if (state === "ok") {
    return (
      <AuthShell
        title="Email verified"
        subtitle="Your account is now fully active."
        icon={BadgeCheck}
        footer={
          <Link href="/account" className="font-semibold text-deep hover:underline">
            Go to your account
          </Link>
        }
      >
        <p className="text-sm text-muted">
          Thanks for confirming your email. You can now place orders and track deliveries.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verification failed" icon={ShieldX}>
      <p className="text-sm text-red-700">{message}</p>
      <div className="mt-4 flex flex-col gap-2 text-sm">
        <Link href="/account" className="font-semibold text-deep hover:underline">
          Resend verification from your account
        </Link>
        <Link href="/login" className="font-semibold text-deep hover:underline">
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  );
}
