This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Deploy on Docker

# Build Image

When changes are made to `/afba/dev.Dockerfile`` run `docker compose -f docker-compose.dev.yml build`

Turns out any config changes need to re-build the image.  E.g. updating Nextjs in `package.json`.

# Run Docker Development Container Locally

Run the image using the command `docker compose -f docker-compose.dev.yml up`

# Production Workflow

Run `npm run publish` to build and push production updates

Alternatively:

Run `docker compose build` to build the production image

Run `docker push denningta/afba:latest` to push production image

On the production server (`~/afba`), back up the database, then pull the new image and recreate
only the app container, which leaves MongoDB running:

```
docker exec mongodb mongodump --db afba --archive --gzip > backup/afba-predeploy-$(date +%Y%m%d-%H%M%S).archive.gz
docker compose pull afba
docker compose up -d afba
```

The server's `docker-compose.yml` should match the one in this repo, minus the `build` section. It
reads Plaid/Mongo settings from the server's own `.env` (`env_file`); the image contains no `.env`.
The database lives in the external `afba_data` volume, so `docker compose down`/`up` never loses data
(on a new host, create it first with `docker volume create afba_data`).

# Sign-in and Users

Everyone in the household signs in with their own email and password and shares the one budget.
Admins can also add and remove people (**Manage users** in the account menu) and manage bank
connections; members use the budget.

The server's `.env` needs:

```
BETTER_AUTH_SECRET=<random, e.g. `openssl rand -base64 32`; changing it signs everyone out>
BETTER_AUTH_URL=http://<server address>:3000
BETTER_AUTH_TRUSTED_ORIGINS=http://192.168.1.*:3000   # other addresses people open the app on
```

**First run:** until an account exists, every page redirects to `/setup`, which creates the first
admin. Do this right after deploying. Once anyone exists, `/setup` is closed and sign-up is disabled;
new people are added by an admin, who gives them a temporary password to change under
**Account settings**.

**Locked out** (e.g. the only admin forgot their password):

```
docker exec -it afba node scripts/reset-password.mjs you@example.com          # set a new password
docker exec -it afba node scripts/reset-password.mjs you@example.com --admin  # ...and make admin
```

It prompts for the password without echoing it and signs that user out everywhere.

# Sync Production Data to Local Development

One-time setup:

- Set `REMOTE_DB_HOST=user@host` in `.env` (or `.env.local`).
- Set up key-based SSH so the sync doesn't prompt for a password: `ssh-copy-id user@host`

Then:

```
npm run db:sync                 # dump prod over SSH and restore into the local dev database
npm run db:restore              # re-restore locally from the newest snapshot (no network needed)
npm run db:restore -- <file>    # restore a specific snapshot
```

`db:sync` runs `mongodump` inside the production `mongodb` container, streams it over SSH into
`mongorestore` in the local container, and saves a copy to `backup/afba-<timestamp>.archive.gz`
(the newest 5 are kept). It starts the local database, and creates the `afba_data` volume, if needed.
Local collections are replaced with the production copies.

A logical dump is used instead of copying the Docker volume because it is consistent while the
server is running and works across MongoDB versions (prod runs `mongo:latest`, dev runs `mongo:7.0`,
and 7.0 cannot open data files written by 8.x).
