# BIZ BOOK — Complete System Architecture

> Nigerian B2B/B2C marketplace. Vendors list products, shoppers compare and buy, both sides communicate via real-time chat.

---

## Skeletal System — Project Structure

```
biz-book/
├── backend/
│   ├── server.js                  ← Fastify entry point (replaces Express)
│   ├── package.json
│   ├── .env / .env.example
│   ├── pm2.config.js              ← Cluster-mode process manager
│   │
│   ├── routes/
│   │   ├── auth.js                ← /api/auth/*
│   │   ├── products.js            ← /api/products/*
│   │   ├── vendor.js              ← /api/vendor/* + /api/vendors/*
│   │   ├── shopper.js             ← /api/shopper/*
│   │   ├── listings.js            ← /api/listings/*
│   │   ├── search.js              ← /api/search/*
│   │   ├── chat.js                ← /api/chat/*
│   │   └── personalization.js     ← /api/events + /api/recommendations
│   │
│   ├── middleware/
│   │   └── upload.js              ← @fastify/multipart → Sharp → local file
│   │
│   ├── utils/
│   │   ├── index.js               ← pg Pool + JWT authenticateToken
│   │   ├── auth.js                ← Token generation, refresh, security logging
│   │   ├── cache.js               ← ioredis wrapper (graceful no-op if Redis down)
│   │   ├── aiHooks.js             ← Product risk analysis, event recording
│   │   ├── securityMonitor.js     ← Brute-force detection, account locking
│   │   └── csrf.js                ← (legacy, no longer used in Fastify)
│   │
│   ├── queues/
│   │   └── imageQueue.js          ← BullMQ queue definition
│   │
│   ├── workers/
│   │   └── imageWorker.js         ← BullMQ worker: local file → Cloudinary
│   │
│   ├── uploads/products/          ← Local WebP image storage
│   │
│   └── migrations/
│       ├── add-performance-indexes.js
│       ├── add-materialized-views.js
│       └── migrate-*.js
│
└── frontend/
    ├── src/
    │   ├── main.tsx               ← React root, QueryClientProvider
    │   ├── App.tsx                ← Router + nav
    │   │
    │   ├── contexts/
    │   │   ├── UserContext.tsx    ← Auth state, apiRequest helper
    │   │   ├── ChatContext.tsx    ← Socket.io messages, cookie persistence
    │   │   └── ToastContext.ts    ← Notification toasts
    │   │
    │   ├── hooks/
    │   │   ├── useUser.ts         ← Consumes UserContext
    │   │   ├── useProducts.ts     ← TanStack Query: browse, search, detail
    │   │   ├── useVendorProducts.ts ← TanStack Query: vendor CRUD mutations
    │   │   └── useWatchlist.ts    ← TanStack Query: watchlist + optimistic updates
    │   │
    │   ├── routes/
    │   │   └── guards.tsx         ← RequireVendor, RequireShopper, GuestOnly
    │   │
    │   ├── lib/
    │   │   └── queryClient.ts     ← TanStack QueryClient config
    │   │
    │   └── components/
    │       ├── LandingPage.tsx
    │       ├── Login.tsx / SignupVendor.tsx / SignupShopper.tsx
    │       ├── VendorDashboard.tsx / ShopperDashboard.tsx
    │       ├── VendorProductManager.tsx
    │       ├── VendorAnalytics.tsx / VendorSalesReport.tsx
    │       ├── VendorChats.tsx
    │       ├── ProductBrowse.tsx  ← useInfiniteQuery infinite scroll
    │       ├── ProductDetails.tsx
    │       ├── ProductSearch.tsx / AdvancedProductSearch.tsx
    │       ├── SmartComparison.tsx / EnhancedProductComparison.tsx
    │       ├── Watchlist.tsx / SmartPriceAlerts.tsx
    │       └── ui/                ← Shared UI primitives
    └── package.json
```

---

## Circulatory System — Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER                                     │
│                                                                     │
│  React 19 + TypeScript                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ UserContext  │  │ ChatContext  │  │  TanStack Query Cache    │  │
│  │ (auth state) │  │ (socket msgs)│  │  (60s TTL, bg refetch)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                │
│         └────────── apiRequest() ─────────────────┘                │
│                           │                                         │
│              HTTP (fetch) + WebSocket (Socket.io)                   │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      FASTIFY SERVER (port 3001)                     │
│                                                                     │
│  @fastify/cors → @fastify/helmet → @fastify/rate-limit              │
│  @fastify/multipart (file uploads) → @fastify/static (uploads/)     │
│                                                                     │
│  JWT authenticate decorator (preHandler on protected routes)        │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  /auth   │ │/products │ │ /vendor  │ │ /shopper │ │  /chat   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ │
│       │            │            │             │            │        │
│  ┌────▼────────────▼────────────▼─────────────▼────────────▼──────┐ │
│  │                    Redis Cache (ioredis)                        │ │
│  │  products:browse:* (60s)  products:detail:* (120s)             │ │
│  │  products:categories (300s)   [bust on vendor mutation]        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL (pg Pool)                       │   │
│  │  max:20 connections  idleTimeout:30s  statementTimeout:30s   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Socket.IO ──► rooms: "listing:{productId}"                         │
│                message:send → persist → broadcast → message:ack     │
└─────────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                    BACKGROUND WORKERS                               │
│                                                                     │
│  BullMQ (Redis-backed)                                              │
│  imageWorker.js: local WebP → Cloudinary → UPDATE product_images   │
│                                                                     │
│  setInterval: REFRESH MATERIALIZED VIEW CONCURRENTLY (every 5 min) │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Muscular System — API Endpoints

### Auth `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup/vendor` | — | Register vendor |
| POST | `/signup/shopper` | — | Register shopper |
| POST | `/login` | — | Login, returns JWT pair |
| GET | `/me` | JWT | Current user profile |
| PUT | `/profile` | JWT | Update personal info |
| PUT | `/vendor-profile` | JWT+Vendor | Update business info |
| PUT | `/change-password` | JWT | Change password, invalidates tokens |
| POST | `/refresh` | — | Rotate access + refresh tokens |
| POST | `/logout` | JWT | Invalidate tokens |
| POST | `/logout-all` | JWT | Logout all devices |
| GET | `/security-logs` | JWT+Admin | Security audit log |

### Products `/api/products`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | — | Category list (cached 5min) |
| GET | `/search` | — | FTS + filters + price analysis |
| GET | `/browse` | — | Paginated feed (cached 60s) |
| GET | `/vendor/:vendorId` | — | Products by vendor |
| GET | `/:id` | — | Product detail (cached 2min) |
| POST | `/compare` | — | Side-by-side comparison |

### Vendor `/api/vendor` + `/api/vendors`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/vendor/products` | JWT+Vendor | Add product + images |
| GET | `/vendor/products` | JWT+Vendor | List own products |
| GET | `/vendor/products/:id` | JWT+Vendor | Single product |
| PUT | `/vendor/products/:id` | JWT+Vendor | Update product + images |
| PATCH | `/vendor/products/:id/status` | JWT+Vendor | Publish/draft/archive |
| DELETE | `/vendor/products/:id` | JWT+Vendor | Delete product |
| POST | `/vendor/products/bulk` | JWT+Vendor | Bulk activate/delete |
| POST | `/vendor/products/bulk-edit` | JWT+Vendor | Bulk price/stock edit |
| GET | `/vendor/products/ai-flags` | JWT+Vendor | Bulk AI risk flags |
| GET | `/vendor/products/:id/ai-flags` | JWT+Vendor | Single AI risk flag |
| POST | `/vendors/sales` | JWT+Vendor | Submit sales report |
| GET | `/vendors/sales` | JWT+Vendor | Sales history |
| GET | `/vendors/analytics` | JWT+Vendor | Sales analytics |

### Shopper `/api/shopper`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/shopper/profile` | JWT | Create shopper profile |
| GET | `/shopper/profile/exists` | JWT | Check profile exists |
| GET | `/shopper/stats` | JWT+Shopper | Comparisons, reviews, savings |
| GET | `/shopper/watchlist` | JWT+Shopper | Get watchlist |
| POST | `/shopper/watchlist` | JWT+Shopper | Add to watchlist |
| DELETE | `/shopper/watchlist/:productId` | JWT+Shopper | Remove from watchlist |

### Other Routes
| Prefix | Routes |
|--------|--------|
| `/api/listings` | GET / , GET /:id , POST / , PATCH /:id , DELETE /:id |
| `/api/search` | suggestions, trending, analytics, saved, history |
| `/api/chat` | by-listing/:id, /:convId/messages, /:convId/read, import |
| `/api/events` | POST (track user interactions) |
| `/api/recommendations` | GET (personalized product feed) |

---

## Database Schema

```
users
  id · email · password_hash · user_type[vendor/shopper/admin]
  first_name · last_name · is_active · created_at · updated_at

vendors
  id · user_id→users · business_name · business_description
  category · location · phone · website · created_at · updated_at

shoppers
  id · user_id→users · full_name · address · phone_number · created_at

products
  id · name · price · description · category · vendor_id→vendors
  stock_quantity · status[draft/published/archived] · sku
  state · city · specifications(JSONB) · created_at · updated_at

product_images
  id · product_id→products · image_url · is_primary · display_order

reviews
  id · product_id→products · shopper_id→shoppers
  rating · comment · verified_purchase · created_at

wishlist
  id · shopper_id→shoppers · product_id→products · created_at

comparisons
  id · shopper_id→shoppers · ...

refresh_tokens
  id · user_id→users · token_hash · expires_at · invalidated_at

security_logs
  id · user_id→users · action · details(JSONB)
  ip_address · user_agent · created_at

chat_conversations
  id · product_id→products · last_message_at · last_message_text
  unread_vendor_count · unread_shopper_count · created_at · updated_at

chat_messages
  id · conversation_id→chat_conversations · product_id→products
  sender_role[vendor/shopper/system] · client_msg_id · text · created_at

search_history · search_suggestions · popular_searches
search_analytics · saved_searches

user_events
  id · user_id · product_id · type · metadata(JSONB) · created_at

internal_events
  id · type · payload(JSONB) · created_at

product_ai_flags
  product_id PK · risk_score(0-100) · flags(JSONB) · updated_at

sales_reports
  id · vendor_id→vendors · product_id→products · quantity
  total_amount · report_date · notes · created_at · updated_at

── Materialized Views (refreshed every 5 min) ──────────────────────
vendor_sales_summary      category_price_stats
daily_search_trends       product_view_counts

── Performance Indexes ─────────────────────────────────────────────
idx_products_category_status    idx_products_vendor_status
idx_products_created_at         idx_products_price
idx_chat_messages_conversation  idx_user_events_user_product
idx_user_events_type_created    idx_wishlist_shopper
idx_search_history_user         idx_refresh_tokens_user
```

---

## Flowcharts

### Auth Flow
```
Register ──► validate (email, password, phone)
         ──► bcrypt.hash(password, 12)
         ──► DB transaction: INSERT users + vendors|shoppers
         ──► generateAccessToken (15min JWT)
         ──► generateRefreshToken (7d JWT)
         ──► storeRefreshToken (hashed in DB)
         ──► logSecurityEvent('USER_REGISTERED')
         ──► return { user, accessToken, refreshToken }

Every Request ──► Authorization: Bearer <token>
              ──► fastify.authenticate preHandler
              ──► jwt.verify(token, JWT_SECRET)
              ──► 401? ──► POST /auth/refresh
                          ──► verify refreshToken JWT
                          ──► hash + compare vs DB
                          ──► check expiry
                          ──► rotate: new access + refresh
                          ──► retry original request
```

### Image Upload Flow
```
POST /vendor/products (multipart)
  │
  ├─ Phase 1 (inline, ~50ms)
  │   processMultipartImages(request)
  │   └─ @fastify/multipart parts() iterator
  │   └─ Sharp: resize 800x800 → WebP → /uploads/products/
  │   └─ Sharp: thumbnail 200x200 → WebP
  │   └─ INSERT product_images (local URL)
  │   └─ API responds immediately ✓
  │
  └─ Phase 2 (background, BullMQ)
      enqueueImageUploads(jobItems, productId)
      └─ Worker picks up job
      └─ Read local file → upload to Cloudinary
      └─ UPDATE product_images SET image_url = cloudinary_url
      └─ DELETE local file
      (graceful fallback: sync upload if Redis unavailable)
```

### Real-Time Chat Flow
```
Shopper opens product page
  ├─ ChatContext: load cookie messages for listingId
  ├─ GET /api/chat/by-listing/:id → get/create conversation
  ├─ socket.emit('joinRoom', { roomId: 'listing:123' })
  └─ [one-time] migrate cookie msgs → POST /import → hydrate from DB

Send message
  ├─ socket.emit('message:send', { roomId, message, clientMsgId })
  ├─ Server: INSERT chat_messages, UPDATE unread counts
  ├─ Server: io.to(room).emit('message:new', msg)  ← all clients
  └─ Server: socket.emit('message:ack', { messageId, serverTimestamp })

Vendor sees badge
  └─ ChatContext.conversations[listingId].unreadCount
     → VendorChatsLink badge in navbar
```

### AI Risk Hook Flow
```
Any product mutation (create/update/status/delete)
  └─ onProductMutated() [setImmediate — non-blocking]
      ├─ recordInternalEvent('product.mutated')
      ├─ recordUserEvent('catalog_update')
      ├─ analyzeProductRisk(productId)
      │   ├─ keyword scan: scam/fraud/counterfeit/fake/pirated
      │   ├─ price vs category 90-day avg baseline
      │   ├─ risk score 0-100 → UPSERT product_ai_flags
      │   └─ score ≥ 70 → securityMonitor.detectSuspiciousActivity
      └─ price jump ≥ 50% → recordInternalEvent('product.price_jump')
```

### Token Refresh Flow
```
apiRequest() sends request
  └─ 401 response
      └─ POST /api/auth/refresh { refreshToken }
          ├─ verifyRefreshToken (JWT signature)
          ├─ SELECT from refresh_tokens WHERE user_id
          ├─ hash(provided) === stored hash?
          ├─ expires_at > NOW()?
          ├─ generateAccessToken (new 15min)
          ├─ generateRefreshToken (new 7d)
          ├─ storeRefreshToken (rotate)
          └─ return { accessToken, refreshToken }
              └─ retry original request with new token
```

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│                                                                         │
│  React 19 + TypeScript + Vite 7 + Tailwind v4                          │
│                                                                         │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │  UserContext    │  │   ChatContext    │  │  TanStack Query v5   │   │
│  │  - auth state   │  │  - socket msgs   │  │  - 60s staleTime     │   │
│  │  - apiRequest() │  │  - cookie cache  │  │  - optimistic updates│   │
│  │  - token rotate │  │  - server hydrate│  │  - infinite scroll   │   │
│  └────────┬────────┘  └────────┬─────────┘  └──────────┬───────────┘   │
│           └───────────────────┼────────────────────────┘               │
│                               │                                         │
│  React Router v7 Guards: RequireVendor / RequireShopper / GuestOnly     │
└───────────────────────────────┼─────────────────────────────────────────┘
                                │ HTTPS + WSS
┌───────────────────────────────▼─────────────────────────────────────────┐
│                        FASTIFY v5 SERVER                                │
│                                                                         │
│  Plugins: cors · helmet · rate-limit · static · multipart · formbody   │
│  Decorator: fastify.authenticate (JWT preHandler)                       │
│                                                                         │
│  ┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌──────────────┐  │
│  │ auth │ │product │ │ vendor │ │shopper │ │ chat │ │search/person │  │
│  └──┬───┘ └───┬────┘ └───┬────┘ └───┬────┘ └──┬───┘ └──────┬───────┘  │
│     └─────────┴──────────┴──────────┴──────────┴────────────┘          │
│                               │                                         │
│              ┌────────────────┼────────────────┐                        │
│              ▼                ▼                ▼                        │
│         ┌─────────┐    ┌──────────┐    ┌──────────────┐                │
│         │  Redis  │    │ pg Pool  │    │  Socket.IO   │                │
│         │ (cache) │    │(max 20)  │    │  rooms:      │                │
│         │ ioredis │    │ Postgres │    │  listing:*   │                │
│         └────┬────┘    └────┬─────┘    └──────────────┘                │
│              │              │                                           │
│         ┌────▼──────────────▼──────────────────────────────────────┐   │
│         │                  BullMQ (Redis-backed)                    │   │
│         │  imageQueue → imageWorker → Cloudinary → UPDATE DB        │   │
│         └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                         DATA LAYER                                      │
│                                                                         │
│  PostgreSQL                                                             │
│  ├─ 20+ tables (users, vendors, shoppers, products, ...)               │
│  ├─ JSONB columns (specifications, flags, metadata)                    │
│  ├─ Full-text search (tsvector/tsquery on products)                    │
│  ├─ 10 performance indexes                                             │
│  └─ 4 materialized views (refreshed every 5 min)                      │
│                                                                         │
│  Cloudinary (production image CDN)                                      │
│  Local /uploads/products/ (development fallback)                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| State — server | TanStack Query v5 |
| State — auth | React Context (UserContext) |
| State — chat | React Context (ChatContext) |
| Routing | React Router v7 |
| Charts | Recharts |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Backend framework | Fastify v5 |
| Language | Node.js (CommonJS) |
| Database | PostgreSQL (pg v8) |
| Cache | Redis (ioredis) |
| Job queue | BullMQ |
| Image processing | Sharp |
| Image CDN | Cloudinary |
| Real-time | Socket.IO v4 |
| Auth | JWT (jsonwebtoken) |
| Password hashing | bcrypt (12 rounds) |
| Input sanitization | xss + validator |
| Process manager | PM2 (cluster mode) |

---

## Security Architecture

```
Request pipeline:
  @fastify/helmet     → CSP, HSTS, X-Frame-Options, nosniff
  @fastify/cors       → allowlist from CORS_ORIGINS env
  @fastify/rate-limit → 300 req/15min (prod), unlimited (dev)
  fastify.authenticate → JWT verify on protected routes
  authenticateVendor  → user_type check + vendors table lookup
  authenticateShopper → user_type check + shoppers table lookup
  XSS sanitize        → all string inputs via xss library
  Parameterized SQL   → no string interpolation in queries
  bcrypt (12 rounds)  → password hashing
  Token rotation      → refresh tokens hashed (SHA-256) in DB
  Security logging    → every auth event → security_logs table
  AI risk scoring     → keyword + price anomaly → product_ai_flags
  Account locking     → 5 failed logins → is_active=false (30min)
```

---

## Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3001
JWT_SECRET=...
SESSION_SECRET=...

# CORS
CORS_ORIGINS=https://yourdomain.com

# PostgreSQL
DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONN_TIMEOUT=5000
DB_STATEMENT_TIMEOUT=30000

# Redis (optional — graceful no-op if absent)
REDIS_URL=redis://localhost:6379

# Cloudinary (optional — local storage if absent)
CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
```

---

## Deployment

```bash
# Install
npm install          # backend
npm install          # frontend

# Database migrations (run once)
npm run migrate:indexes:perf   # performance indexes
npm run migrate:views          # materialized views

# Development
npm run dev          # backend: nodemon → server.js
npm run dev          # frontend: vite

# Production (PM2 cluster mode)
npm run pm2:start    # spawns one process per CPU core
npm run pm2:logs     # tail logs
npm run pm2:stop     # graceful shutdown

# Background image worker (standalone, optional)
npm run worker:images
```
