This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Stripe Contributions

Campaign contributions use Stripe Checkout. Configure these variables in your local `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For local webhook testing, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and use the signing secret printed by the Stripe CLI as `STRIPE_WEBHOOK_SECRET`. In production, register `/api/webhooks/stripe` as a Stripe webhook endpoint and enable `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired` events.

## Password Resets

Password reset emails are sent through Resend. Configure a Resend API key, a verified sender address, and the public base URL in `.env`:

```env
RESEND_API_KEY=re_...
EMAIL_FROM="Market_ly <no-reply@your-verified-domain.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Reset links expire after one hour and can only be used once.

## Email Verification and Admin Access

New password-based accounts must verify their email before signing in. The verification link expires after 24 hours. The Resend variables above are also required for signup verification.

Admin privileges are never accepted from public signup. Create an administrator from a trusted server environment by setting `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (at least 12 characters), then running:

```sh
npm run admin:create
```

This creates the admin account or promotes the matching email and sets its password. Keep these variables out of source control. The admin console is available at `/dashboard/admin` after signing in.

Signup normalizes email addresses, and MongoDB enforces uniqueness on the normalized address.

## Workspace and Community Data

The whole application uses MongoDB through Prisma 6. Set `MONGODB_URI` to a MongoDB replica-set connection. The app uses a valid `MONGODB_DATABASE` override when supplied, the database in the URI otherwise, and `marketly` as the fallback. Keep credentials in an ignored environment file. Transactions require a replica set; MongoDB Atlas provides one by default.

The existing PostgreSQL database is preserved. The one-time importer copied the current users, campaigns, and campaign memberships into the URI-selected MongoDB database. To repeat or inspect a future copy, set `DATABASE_URL` to the PostgreSQL source, then run `npm run data:copy:dry-run` before `npm run data:copy:apply`. The importer is idempotent and preserves existing IDs.

MongoDB has no Prisma Migrate workflow in Prisma 6. Run `npm run db:push` after schema changes to synchronize collections and indexes.

## Campaign Credits

Admins set the credit rate at `/dashboard/admin`; the launch charge is rounded up from `target views × credits per 1,000 views ÷ 1,000`. Credit debits/refunds and admin grants are recorded in the ledger. Credits are currently granted by admins; there is no credit-purchase flow.

## Google Ads

The admin console reads and pauses/enables live Google Ads campaigns when these server-only variables are configured: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, and `GOOGLE_ADS_API_VERSION`. For manager accounts, optionally set `GOOGLE_ADS_LOGIN_CUSTOMER_ID`. Never expose these credentials to the browser or commit them to source control.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
