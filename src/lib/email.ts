import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Everlegacy <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

/** Wraps email body content in a plain, calm layout matching the site's tone. */
function layout(bodyHtml: string) {
  return `
  <div style="background:#f6f1e4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#fffdf8;border-radius:16px;overflow:hidden;">
      <div style="background:#0c2018;padding:28px 32px;">
        <span style="color:#e3cd97;font-size:13px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;">Everlegacy</span>
      </div>
      <div style="padding:32px;color:#1c2b23;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px;border-top:1px solid rgba(28,43,35,0.08);color:rgba(28,43,35,0.5);font-size:12px;">
        Everlegacy &middot; <a href="mailto:support@everlegacy.link" style="color:rgba(28,43,35,0.5);">support@everlegacy.link</a>
      </div>
    </div>
  </div>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;background:#c8a24a;color:#241a06;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:999px;">${label}</a>`;
}

/**
 * All send*Email functions are no-ops (log and return) when RESEND_API_KEY
 * isn't set, so the app works fully without email configured — nothing
 * blocks on it.
 */

export async function sendWelcomeEmail(to: string) {
  const client = getClient();
  if (!client) return console.warn("RESEND_API_KEY not set — skipping welcome email");

  await client.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Everlegacy",
    html: layout(`
      <p>Thank you for creating an account.</p>
      <p>You can now build a tribute page — add photos, dates, and their story, in your own time.
      When it's ready, order a plaque and we'll engrave it with a QR code linking straight to the page.</p>
      ${button(`${SITE_URL}/account/edit`, "Start building")}
    `),
  });
}

export async function sendOrderConfirmationEmail(params: {
  to: string;
  name: string;
  quantity: number;
  tributeUrl: string | null;
}) {
  const client = getClient();
  if (!client) return console.warn("RESEND_API_KEY not set — skipping order confirmation email");

  const { to, name, quantity, tributeUrl } = params;
  await client.emails.send({
    from: FROM,
    to,
    subject: "Your Everlegacy order is confirmed",
    html: layout(`
      <p>Thank you, ${name.split(" ")[0]}.</p>
      <p>We've received your order for ${quantity} ${quantity === 1 ? "plaque" : "plaques"}.
      We'll engrave it with the QR code for your tribute page and post it to you.</p>
      ${tributeUrl ? `<p>Your tribute page: <a href="${tributeUrl}" style="color:#8a6a2c;">${tributeUrl}</a></p>` : ""}
      ${button(`${SITE_URL}/account`, "View your order")}
    `),
  });
}

const STATUS_COPY: Record<string, { subject: string; body: string }> = {
  shipped: {
    subject: "Your plaque has shipped",
    body: "Your plaque is on its way. It should arrive within a few working days.",
  },
  delivered: {
    subject: "Your plaque has been delivered",
    body: "Your plaque has been marked as delivered. We hope it brings comfort wherever it's placed.",
  },
};

export async function sendOrderStatusEmail(params: { to: string; name: string; status: string }) {
  const copy = STATUS_COPY[params.status];
  if (!copy) return; // no email for "processing" — that's the default state, not a status change worth notifying

  const client = getClient();
  if (!client) return console.warn("RESEND_API_KEY not set — skipping order status email");

  await client.emails.send({
    from: FROM,
    to: params.to,
    subject: copy.subject,
    html: layout(`
      <p>Hello ${params.name.split(" ")[0]},</p>
      <p>${copy.body}</p>
      ${button(`${SITE_URL}/account`, "View your order")}
    `),
  });
}
