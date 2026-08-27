# ReelPermit

Michigan fishing-license assistance site. Local-only for now.

ReelPermit is a private service — not affiliated with the Michigan DNR or any government agency.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys are required:

- Payments simulate as `DEV-…` charges
- Emails print to the terminal
- Admin uses an in-memory store (`MONGODB_URI=memory`)

Copy `.env.example` to `.env.local` if you want to add Resend, NMI, Postgres, or Cloudinary later.

## Scripts

- `npm run dev` — Next.js
- `npm run build` — production build (skips DB migrations when `DATABASE_URL` is unset)
- `npm run admin:seed` — create the first admin user (needs `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`)
- `npm run db:migrate` — apply `migrations/` when Postgres is configured

## GitHub

Repository: [saad-sdte/reel-permit](https://github.com/saad-sdte/reel-permit)

This folder is its own git repo. Do not push it into the AnglerPermit remote.
