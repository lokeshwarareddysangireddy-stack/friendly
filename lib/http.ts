import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json(
      { ok: false, error: "Validation failed", fields },
      { status: 422 }
    );
  }
  const message =
    error instanceof Error ? error.message : "Something went wrong";
  const safe =
    process.env.NODE_ENV === "production" ? "Something went wrong" : message;
  console.error("[api-error]", message);
  return NextResponse.json({ ok: false, error: safe }, { status: 500 });
}
