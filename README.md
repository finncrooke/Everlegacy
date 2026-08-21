# Everlegacy

A memorial QR plaque ordering and tribute-page platform. Customers order a
physical, engraved QR plaque; the QR code links to a private tribute page
they build for a loved one (photos, story, timeline).

## Stack

- **Next.js (App Router)** — frontend, deployed on Vercel
- **Supabase** — auth, Postgres database
- **Cloudflare R2** — photo storage (zero egress fees for public page views)
- **Cloudflare Stream** — video hosting/transcoding (not yet wired into the
  editor UI in this v1 — photos are fully supported; see "Next steps")
- **Stripe Checkout** — payment
- **Tailwind CSS** — styling

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### 1. Supabase

1. Create a project at supabase.com.
2. Run `supabase/schema.sql` in the SQL editor — it creates the `orders`,
   `tribute_pages`, `tribute_photos` and `tribute_timeline_entries` tables
   with row-level security policies.
3. In **Authentication → Email**, keep "Confirm email" on if you want
   Supabase's built-in confirmation email to double as the welcome email,
   and set the confirmation redirect URL to `{SITE_URL}/account`.
4. Copy the project URL, anon key and service role key into `.env.local`.

### 2. Stripe

1. Create a Stripe account, get your secret key.
2. Create a webhook endpoint pointing at `{SITE_URL}/api/stripe/webhook`
   listening for `checkout.session.completed`, and copy its signing secret.
3. Set `NEXT_PUBLIC_PLAQUE_PRICE_GBP` to the plaque price (v1 has one option).

### 3. Cloudflare R2

1. Create an R2 bucket for tribute photos.
2. Create an API token with read/write access, and note the account ID.
3. Attach a public bucket domain (or a custom domain) and set
   `R2_PUBLIC_HOSTNAME` / `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` to it — the app
   serves photos directly from that domain to keep egress free.

### 4. Admin access

Set `ADMIN_EMAILS` to a comma-separated list of email addresses (the
business owner's account). Create that account by signing up normally
through `/order` → `/order/success` once, or directly in the Supabase
Auth dashboard, then sign in at `/admin/login`.

## App structure

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/order` | Plaque checkout (shipping details → Stripe) |
| `/order/success` | Account creation, right after payment |
| `/login` | Customer log in |
| `/account` | Order status, QR code, link to editor |
| `/account/edit` | Tribute page editor |
| `/t/[slug]` | Public tribute page (no login required) |
| `/admin` | Internal order list, status updates, QR downloads |
| `/admin/login` | Admin sign in |

## Next steps / known gaps for a production launch

- Video upload via Cloudflare Stream isn't wired into the editor yet — only
  photos. Stream's direct-creator-upload API follows the same presigned-URL
  pattern as the R2 photo uploads in `src/lib/r2.ts` / `src/app/api/upload`.
- The tribute editor autosaves only on explicit "Save" — add a debounced
  autosave if customers report losing work.
- No transactional email provider is wired up yet beyond Supabase's default
  auth emails; swap in Resend/Postmark for a branded welcome email.
- Run a design QA pass against the `apple-design` accessibility/consistency
  checklist referenced in the build brief before launch.
