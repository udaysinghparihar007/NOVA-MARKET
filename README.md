# NOVA/MARKET

NOVA/MARKET is a database-driven technology marketplace built as a portfolio project with Next.js, TypeScript, Prisma, PostgreSQL, Tailwind CSS, and shadcn/ui. The storefront focuses on considered devices, computing, and audio products while preserving real catalog, cart, order, review, inventory, authentication, admin, and Stripe flows.

## Features

- Published product catalog backed by PostgreSQL and Prisma
- Parent and child category browsing
- Search, sorting, pagination, and price filtering
- Product images, inventory, variants, reviews, ratings, and SEO metadata
- Persistent cart and order history
- NextAuth authentication with role-based admin access
- Stripe checkout and payment webhooks
- Admin product, inventory, order, and customer workflows
- Cached server queries with mutation revalidation
- Responsive storefront UI with local SVG product imagery

## Stack

- **Application:** Next.js App Router, React, TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Radix UI, Lucide
- **Data:** PostgreSQL on Neon, Prisma ORM
- **Auth and payments:** NextAuth, Stripe
- **Testing:** Jest, React Testing Library, Cypress

## Getting started

### Requirements

- Node.js 20+
- PostgreSQL-compatible database
- npm

### Install and configure

```bash
git clone https://github.com/SatvikPraveen/Nextjs-Ecommerce.git
cd Nextjs-Ecommerce
npm install
cp .env.example .env.local
```

Set the required values in `.env.local`. Keep credentials out of source control:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Add Stripe and OAuth values only when those integrations are needed. Do not commit `.env` or `.env.local`.

### Database and development

```bash
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The seed is safe to rerun for the NOVA/MARKET technology catalog and creates the development admin/customer accounts defined by the seed configuration. Change development credentials before using the project outside a local environment.

## Project structure

```text
app/
  (store)/       Storefront catalog, search, cart, and product routes
  (account)/     Profile and order history
  admin/         Protected administration screens
  api/           Auth, newsletter, and Stripe endpoints
components/     Shared storefront, cart, form, and shadcn/ui components
lib/             Prisma, cache, auth, and utility helpers
server/
  actions/       Server mutations
  queries/       Database-backed read models
prisma/
  schema.prisma  Relational data model
  seed.ts        Idempotent NOVA/MARKET development catalog seed
public/          Local product and category assets
```

## Useful commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
npm test -- --runInBand
npm run test:e2e
npm run db:push
npm run db:seed
npm run db:studio
```

## Deployment

The application can be deployed to Vercel or another Node-compatible platform. Configure the production PostgreSQL/Neon connection, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, Stripe keys and webhook secret, OAuth credentials, and `NEXT_PUBLIC_APP_URL` in the deployment environment. Run Prisma migrations or `db push` according to the project's deployment policy before starting the application.

## Engineering notes

- Storefront queries only expose published products.
- Decimal database prices are serialized before crossing into client components.
- Category queries include descendant categories without duplicating product records.
- Cache keys include dynamic catalog arguments and mutations revalidate relevant tags.
- Product images are local SVG assets mapped from database `ProductImage` records.
- Historical order records should be preserved when catalog data is retired.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) or the contributor documentation before opening a pull request. Run lint, type-checking, and the relevant test suites before submitting changes.

## License and attribution

This project is distributed under the MIT License. See [LICENSE](LICENSE) for the complete terms and original copyright attribution.
