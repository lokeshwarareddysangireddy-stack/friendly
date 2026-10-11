import { createNotificationLog } from "@/lib/db";
import { normalizeMobile } from "@/lib/utils";
import type { NotificationLogDoc, OrderDoc, CustomerDoc } from "@/types";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_"));
}

export function isWhatsAppConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function emailFrom() {
  return process.env.RESEND_FROM_EMAIL || "Friendly Basket <onboarding@resend.dev>";
}

interface SendResult {
  status: NotificationLogDoc["status"];
  provider: string;
  messageId?: string | null;
  error?: string | null;
}

async function log(
  data: Parameters<typeof createNotificationLog>[0]
): Promise<void> {
  try {
    await createNotificationLog(data);
  } catch (error) {
    console.warn("[notifications] failed to log:", (error as Error).message);
  }
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  event: string;
  orderId?: string | null;
}): Promise<SendResult> {
  const preview = input.text.slice(0, 200);
  if (!isEmailConfigured()) {
    await log({
      channel: "email",
      event: input.event,
      orderId: input.orderId ?? null,
      recipient: input.to,
      subject: input.subject,
      preview,
      status: "skipped",
      provider: "none",
      error: "Email provider (RESEND_API_KEY) not configured",
    });
    return { status: "skipped", provider: "none", error: "provider_not_configured" };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      await log({
        channel: "email",
        event: input.event,
        orderId: input.orderId ?? null,
        recipient: input.to,
        subject: input.subject,
        preview,
        status: "failed",
        provider: "resend",
        error: json?.message || `HTTP ${res.status}`,
      });
      return { status: "failed", provider: "resend", error: json?.message };
    }
    await log({
      channel: "email",
      event: input.event,
      orderId: input.orderId ?? null,
      recipient: input.to,
      subject: input.subject,
      preview,
      status: "sent",
      provider: "resend",
      providerMessageId: json?.id ?? null,
    });
    return { status: "sent", provider: "resend", messageId: json?.id };
  } catch (error) {
    await log({
      channel: "email",
      event: input.event,
      orderId: input.orderId ?? null,
      recipient: input.to,
      subject: input.subject,
      preview,
      status: "failed",
      provider: "resend",
      error: (error as Error).message,
    });
    return { status: "failed", provider: "resend", error: (error as Error).message };
  }
}

export async function sendWhatsApp(input: {
  to: string;
  text: string;
  event: string;
  orderId?: string | null;
}): Promise<SendResult> {
  const to = `91${normalizeMobile(input.to)}`.replace(/^9191/, "91");
  const preview = input.text.slice(0, 200);
  if (!isWhatsAppConfigured()) {
    await log({
      channel: "whatsapp",
      event: input.event,
      orderId: input.orderId ?? null,
      recipient: to,
      subject: input.event,
      preview,
      status: "skipped",
      provider: "none",
      error: "WhatsApp Cloud API not configured",
    });
    return { status: "skipped", provider: "none", error: "provider_not_configured" };
  }
  try {
    const endpoint = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: input.text },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      messages?: { id?: string }[];
      error?: { message?: string };
    };
    if (!res.ok) {
      await log({
        channel: "whatsapp",
        event: input.event,
        orderId: input.orderId ?? null,
        recipient: to,
        subject: input.event,
        preview,
        status: "failed",
        provider: "whatsapp_cloud_api",
        error: json?.error?.message || `HTTP ${res.status}`,
      });
      return { status: "failed", provider: "whatsapp_cloud_api", error: json?.error?.message };
    }
    await log({
      channel: "whatsapp",
      event: input.event,
      orderId: input.orderId ?? null,
      recipient: to,
      subject: input.event,
      preview,
      status: "sent",
      provider: "whatsapp_cloud_api",
      providerMessageId: json?.messages?.[0]?.id ?? null,
    });
    return { status: "sent", provider: "whatsapp_cloud_api", messageId: json?.messages?.[0]?.id };
  } catch (error) {
    await log({
      channel: "whatsapp",
      event: input.event,
      orderId: input.orderId ?? null,
      recipient: to,
      subject: input.event,
      preview,
      status: "failed",
      provider: "whatsapp_cloud_api",
      error: (error as Error).message,
    });
    return { status: "failed", provider: "whatsapp_cloud_api", error: (error as Error).message };
  }
}

/* ------------------------------- e-mail shell ---------------------------- */

export function emailShell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f7f3;font-family:Inter,Arial,sans-serif;color:#0b1f14">
  <div style="max-width:560px;margin:0 auto;padding:28px 18px">
    <div style="background:#04311a;border-radius:20px 20px 0 0;padding:22px 26px;color:#fff">
      <div style="font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#c8e6b8">Friendly Basket</div>
      <div style="font-size:22px;font-weight:700;margin-top:6px">${title}</div>
    </div>
    <div style="background:#ffffff;padding:26px;border:1px solid #e3ebe3;border-top:none;border-radius:0 0 20px 20px">
      ${body}
      <hr style="border:none;border-top:1px solid #eef3ee;margin:24px 0" />
      <p style="font-size:12px;color:#7b8a7d;margin:0">Friendly Basket — Everything you need, one message away.</p>
    </div>
  </div></body></html>`;
}

export function emailButton(label: string, href: string) {
  return `<p style="margin:8px 0 18px"><a href="${href}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${label}</a></p>
  <p style="font-size:12px;color:#7b8a7d">Or paste this link into your browser:<br/><span style="color:#0b6b25;word-break:break-all">${href}</span></p>`;
}

/* --------------------------- transactional sends -------------------------- */

export async function sendVerificationEmail(
  customer: Pick<CustomerDoc, "email" | "name">,
  token: string
) {
  const link = `${siteUrl()}/verify-email?token=${token}`;
  return sendEmail({
    to: customer.email,
    subject: "Verify your Friendly Basket account",
    html: emailShell(
      `Welcome, ${customer.name}!`,
      `<p style="font-size:15px;line-height:1.6">Thanks for creating a Friendly Basket account. Please confirm your email address to activate ordering.</p>${emailButton("Verify my email", link)}`
    ),
    text: `Welcome to Friendly Basket! Verify your email: ${link}`,
    event: "customer_verify_email",
  });
}

export async function sendResetEmail(
  customer: Pick<CustomerDoc, "email" | "name">,
  token: string
) {
  const link = `${siteUrl()}/reset-password?token=${token}`;
  return sendEmail({
    to: customer.email,
    subject: "Reset your Friendly Basket password",
    html: emailShell(
      "Reset your password",
      `<p style="font-size:15px;line-height:1.6">Hi ${customer.name}, we received a request to reset your password. This link is valid for 1 hour.</p>${emailButton("Set a new password", link)}<p style="font-size:13px;color:#7b8a7d">If you didn't request this, you can safely ignore this email.</p>`
    ),
    text: `Reset your Friendly Basket password (valid 1 hour): ${link}`,
    event: "customer_reset_password",
  });
}

/* ---------------------------- order notifications ------------------------- */

type OrderNotificationEvent =
  | "order_placed"
  | "payment_confirmed"
  | "order_preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

const EVENT_COPY: Record<OrderNotificationEvent, { title: string; line: string }> = {
  order_placed: {
    title: "Order received",
    line: "We have received your order and it is awaiting payment confirmation.",
  },
  payment_confirmed: {
    title: "Payment confirmed",
    line: "Your payment is confirmed and our team has accepted your order.",
  },
  order_preparing: {
    title: "Your order is being prepared",
    line: "Our team is packing your items with care.",
  },
  out_for_delivery: {
    title: "Out for delivery",
    line: "Your order is on the way. Track your delivery live from your account.",
  },
  delivered: {
    title: "Delivered",
    line: "Your order has been delivered. Thank you for shopping with Friendly Basket!",
  },
  cancelled: {
    title: "Order cancelled",
    line: "Your order has been cancelled. If this was unexpected, please contact support.",
  },
};

export async function notifyOrderEvent(
  event: OrderNotificationEvent,
  order: OrderDoc
): Promise<void> {
  const copy = EVENT_COPY[event];
  if (!copy) return;
  const trackLink = order.lookupToken
    ? `${siteUrl()}/order/success?orderId=${encodeURIComponent(order.orderId)}&token=${order.lookupToken}`
    : `${siteUrl()}/order-lookup`;
  const total = (order.total / 100).toFixed(2);

  if (order.customerEmail) {
    await sendEmail({
      to: order.customerEmail,
      subject: `Friendly Basket — ${copy.title} (${order.orderId})`,
      html: emailShell(
        copy.title,
        `<p style="font-size:15px;line-height:1.6">Hi ${order.customer.name}, ${copy.line}</p>
         <p style="font-size:14px;color:#0b1f14"><strong>Order:</strong> ${order.orderId}<br/>
         <strong>Total:</strong> &#8377;${total}<br/>
         <strong>Status:</strong> ${copy.title}</p>
         ${emailButton("View order", trackLink)}`
      ),
      text: `${copy.title} — order ${order.orderId}, total ₹${total}. View: ${trackLink}`,
      event,
      orderId: order.orderId,
    });
  }

  if (order.customer.mobile) {
    await sendWhatsApp({
      to: order.customer.mobile,
      text: `Friendly Basket\n${copy.title}\nOrder ${order.orderId}\nTotal Rs.${total}\n${copy.line}\nView: ${trackLink}`,
      event,
      orderId: order.orderId,
    });
  }
}
