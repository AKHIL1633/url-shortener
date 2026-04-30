# ⚡ SnapLink — Production SaaS URL Shortener

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-green?style=for-the-badge&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-Upstash-red?style=for-the-badge&logo=redis)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)

> A high-performance, production-grade URL shortening platform built with Next.js, TypeScript, and a dual-database architecture using Upstash Redis and Neon PostgreSQL.

🔗 **Live Demo:** [url-shortener-three-navy-80.vercel.app](https://url-shortener-three-navy-80.vercel.app)

---

## ✨ Features

- **⚡ URL Shortening** — Generate short links instantly with nanoid
- **♻️ Smart Deduplication** — O(1) Redis hash lookup prevents duplicate links
- **🎯 Custom Aliases** — Create memorable custom short URLs
- **⏰ Link Expiration** — Configurable TTL using Redis expiry
- **🔥 Burn After Read** — Self-destructing links deleted after first click
- **📊 Real-time Analytics** — Click tracking with geographic insights
- **📈 Interactive Charts** — Visualize click trends with Recharts
- **🔐 GitHub OAuth** — Secure authentication with NextAuth.js v5
- **👤 User Dashboard** — Per-user link management with CRUD operations
- **📱 QR Code Generation** — Instant QR codes for every short link
- **🛡️ Rate Limiting** — Sliding window rate limiting via Upstash
- **✅ URL Validation** — Robust validation preventing malicious URLs

---

## 🏗️ Architecture

```
User Request
     ↓
Next.js App Router (Serverless)
     ↓
┌─────────────────────────────────┐
│  Upstash Redis                  │
│  • O(1) URL lookup              │
│  • Click analytics cache        │
│  • TTL-based expiration         │
│  • Rate limiting                │
└─────────────────────────────────┘
     ↓
┌─────────────────────────────────┐
│  Neon PostgreSQL (Prisma ORM)   │
│  • User profiles                │
│  • Link metadata                │
│  • Click events (relational)    │
└─────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Cache DB | Upstash Redis |
| Primary DB | Neon PostgreSQL |
| ORM | Prisma v5 |
| Auth | NextAuth.js v5 (GitHub OAuth) |
| Charts | Recharts |
| QR Codes | qrcode |
| Testing | Jest + Testing Library |
| Deployment | Vercel |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── shorten/        # URL shortening endpoint
│   │   ├── analytics/      # Click analytics endpoint
│   │   ├── links/          # User link management
│   │   ├── qr/             # QR code generation
│   │   └── auth/           # NextAuth handlers
│   ├── dashboard/          # User dashboard
│   │   ├── page.tsx
│   │   ├── DashboardClient.tsx
│   │   └── AnalyticsChart.tsx
│   ├── login/              # Login page
│   ├── [slug]/             # Dynamic redirect handler
│   └── not-found.tsx       # Custom 404 page
├── lib/
│   ├── redis.ts            # Upstash Redis client
│   ├── db.ts               # Prisma client
│   └── utils.ts            # Helper functions
├── auth.ts                 # NextAuth config
└── proxy.ts                # Route protection middleware
prisma/
└── schema.prisma           # Database schema
```

---

## 🗄️ Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  githubId  String   @unique
  email     String?
  name      String?
  avatar    String?
  links     Link[]
}

model Link {
  id            String    @id @default(cuid())
  slug          String    @unique
  originalUrl   String
  clicks        Int       @default(0)
  burnAfterRead Boolean   @default(false)
  expiresAt     DateTime?
  user          User      @relation(...)
  clickEvents   Click[]
}

model Click {
  id        String   @id @default(cuid())
  country   String
  city      String
  createdAt DateTime @default(now())
  link      Link     @relation(...)
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Upstash Redis account
- Neon PostgreSQL account
- GitHub OAuth App

### Installation

```bash
# Clone the repository
git clone https://github.com/AKHIL1633/url-shortener.git
cd url-shortener

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# Upstash Redis
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Neon PostgreSQL
DATABASE_URL=your_postgresql_connection_string

# NextAuth
AUTH_SECRET=your_auth_secret
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Run locally

```bash
# Push database schema
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

**Test Coverage:**
```
✅ isValidUrl     — 5 tests
✅ generateSlug   — 3 tests
✅ hashUrl        — 3 tests
Total: 11/11 passing
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/shorten` | Create a short link |
| `GET` | `/api/analytics/[slug]` | Get link analytics |
| `GET` | `/api/links` | Get user's links |
| `DELETE` | `/api/links/[slug]` | Delete a link |
| `GET` | `/api/qr?url=` | Generate QR code |
| `GET` | `/[slug]` | Redirect to original URL |

---

## 🔐 Security Features

- **Rate Limiting** — 10 requests per 10 seconds per IP using Upstash sliding window
- **URL Validation** — Only `http://` and `https://` protocols allowed
- **Burn After Read** — Links self-destruct after first access
- **Protected Routes** — Dashboard requires GitHub authentication
- **Environment Variables** — All secrets stored securely, never in code

---

## 🚢 Deployment

This project is deployed on **Vercel** with automatic CI/CD:

1. Push to `main` branch
2. Vercel automatically builds and deploys
3. `prisma generate` runs before every build

---

## 👨‍💻 Author

**Akhil P** — [@AKHIL1633](https://github.com/AKHIL1633)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
