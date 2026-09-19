# NOVA/MARKET

> A full-stack technology e-commerce platform built with Next.js, TypeScript, Prisma, PostgreSQL, and Neon.

NOVA/MARKET is a database-driven e-commerce application focused on consumer technology products such as smartphones, laptops, and audio devices.

The project demonstrates full-stack software engineering across the storefront, server-side application layer, relational database, authentication, inventory, reviews, cart and order workflows, payments, caching, testing, and deployment.

---

## 🚀 Demo

**Live Demo:** `https://your-deployment-url.com`

**GitHub:** `https://github.com/YOUR_USERNAME/YOUR_REPOSITORY`

> Add screenshots or a short demo video here once the production deployment is available.

---

## 📸 Preview

### Storefront

![NOVA/MARKET Homepage](./docs/screenshots/homepage.png)

### Product Catalog

![NOVA/MARKET Product Catalog](./docs/screenshots/products.png)

### Product Details

![NOVA/MARKET Product Details](./docs/screenshots/product-details.png)

> Screenshots are stored locally in `docs/screenshots/`.

---

# ✨ Features

## Storefront

- Technology-focused product catalog
- Responsive product grid
- Product detail pages
- Hierarchical category navigation
- Product search
- Sorting
- Price filtering
- Pagination
- Product image galleries
- Product variants
- Inventory-aware availability
- Reviews and ratings
- SEO metadata

## Commerce

- Persistent shopping cart
- Order creation and history
- Inventory tracking
- Stock-aware purchasing
- Stripe checkout
- Stripe webhook handling
- Order lifecycle management

## Authentication & Authorization

- User authentication
- Protected account pages
- Role-based admin access
- Protected administration routes
- Customer order history
- Admin product and inventory management

## Administration

- Product management
- Category management
- Inventory management
- Order management
- Customer management
- Product publishing controls

## Engineering

- Server-side data fetching
- Prisma ORM
- PostgreSQL relational database
- Neon-hosted database
- Cached server queries
- Targeted cache invalidation
- Type-safe application code
- Automated testing
- Production-oriented error handling
- Responsive UI

---

# 🧠 Engineering Highlights

NOVA/MARKET was designed as more than a static e-commerce UI. The application uses a relational database and server-side application layer to keep the storefront driven by real application data.

### Database-driven catalog

Products, categories, images, variants, inventory, reviews, carts, and orders are stored in PostgreSQL and accessed through Prisma.

The UI does not rely on hardcoded product objects.

```text
PostgreSQL
    ↓
Prisma
    ↓
Server Queries / Actions
    ↓
Next.js
    ↓
React Components