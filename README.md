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

## Secrets and git hooks

Keys, passwords and tokens never go into git. They live in env files outside the repo (prod: `/etc/amigo/prod.env`, key files under `/etc/amigo/`; see `deploy/prod.env.example` in amigo-backend). Enable the hooks once per clone:

```
git config core.hooksPath .githooks
```

`pre-commit` and `pre-push` run `.githooks/secret-scan.sh`, which blocks private keys, service-account JSON, AWS keys, JWTs, URLs with passwords, `*_SECRET/_PASSWORD/_KEY=value` lines and secret files (`.env`, `*.p8`, keystores, `key.properties`). It prints only file and line, never the value. A line that only holds a placeholder may carry the marker `secret-scan: allow`. `.githooks/secret-scan.sh --tree` checks the whole repo.
