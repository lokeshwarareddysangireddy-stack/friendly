# Friendly Basket

Everything You Need. One Message Away!

A production-ready local ordering and delivery website for **Friendly Basket**, built with
Next.js (App Router), TypeScript and Tailwind CSS. Customers can shop and pay online, or
send an enquiry over WhatsApp. An admin dashboard manages orders, products, categories,
delivery zones, FAQs, promotions and enquiries.

## Tech stack

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4, Lucide icons, custom brand design system
- **Database:** MongoDB Atlas via Mongoose (falls back to an in-memory seeded store in dev)
- **Payments:** Razorpay (falls back to a clearly-labelled mock mode in dev)
- **Media:** Cloudinary (optional, for admin image uploads)
- **Auth:** JWT (`jose`) in an httpOnly cookie, bcrypt password hashing
- **Receipts:** PDF receipts generated with pdfkit
- **Validation:** zod

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in values (all optional in dev)
npm run dev
```

Open http://localhost:3000.

> **No configuration required for local development.** Without `MONGODB_URI` the app uses
> an in-memory store seeded with sample data. Without Razorpay keys, checkout runs in a
> clearly-labelled mock payment mode. Data resets on restart.

### Admin dashboard

Visit `/admin` and sign in with the seeded credentials (from your env, defaults shown):

```
Email:    admin@friendlybasket.com
Password: FriendlyBasket@2026
```

The admin is created lazily on first login if no admin user exists. **Change
`ADMIN_PASSWORD` (and set `ADMIN_AUTH_SECRET`) before going live.**

## Environment variables

See [`.env.example`](./.env.example). Highlights:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public base URL for metadata/sitemap/receipts |
| `MONGODB_URI` | MongoDB connection string (optional in dev) |
| `ADMIN_AUTH_SECRET` | JWT signing secret, ≥16 chars (required in prod) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin credentials |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay API keys |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies Razorpay webhooks |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key for browser Checkout |
| `CLOUDINARY_*` | Enables admin image uploads |

## Money & pricing

All monetary values are stored and handled as **integer paise** server-side. Admin forms
accept rupees and convert automatically. Delivery charges are resolved from the delivery
zone matching the customer's pincode, including minimum order values and free-delivery
thresholds.

### Checkout coupons

Set the server-side `COUPONS_JSON` environment variable to enable fixed-amount
coupon codes. Amounts and minimum subtotals are in rupees; codes are case-insensitive.
For example:

```json
[{"code":"SAVE50","amount":50,"minOrder":500,"expiresAt":"2027-01-01T00:00:00Z"}]
```

The default is `[]` (no active codes). Customers can apply or remove a code at
checkout. The server checks the code, expiry and minimum subtotal both when quoting
and when creating the payment. Discounts are capped to leave at least ₹1 payable.
The applied code is saved in the order notes and the discount appears in receipts.
Run coupon checks with Node.js 22.18+ using `node --test tests/coupons.test.mjs`.

## Scripts

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint
```

## Project structure

```
app/
  (site)/            Public storefront (home, services, product, cart, checkout, …)
  admin/             Admin dashboard (protected by middleware + session)
  api/               Route handlers (public shopping + admin CRUD)
components/
  admin/ home/ cart/ checkout/ products/ services/ content/ layout/ ui/
lib/
  db/                Data access layer (Mongo + in-memory fallback) and seed data
  auth/ delivery/ cart/ payments/ receipt/ whatsapp/ cloudinary/ validation/
models/              Mongoose schemas
middleware.ts        Protects /admin and /api/admin (except /api/admin/login)
```

## Notes on brand assets

Real logo/image assets were not provided. The project ships with brand-coloured SVG
fallbacks in `public/images/`. See `public/images/BRAND_ASSETS_MISSING.txt`. Replace the
fallbacks and add product images via the admin dashboard (Cloudinary) or directly.

## Deployment

1. Push to GitHub and import the repo on [Vercel](https://vercel.com).
2. Add all environment variables from `.env.example` in the Vercel project settings.
3. Ensure `ADMIN_AUTH_SECRET` is set to a strong random value.
4. Configure the Razorpay webhook to point at `https://<your-domain>/api/webhooks/razorpay`.

## Legal note

Friendly Basket is a local ordering and delivery assistance service. Medicine and health
items are handled as enquiries; a valid prescription is required where legally necessary.
The service does not represent itself as a licensed pharmacy or licensed medical provider
unless separately confirmed in writing.
