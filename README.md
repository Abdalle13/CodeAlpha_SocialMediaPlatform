# Veyra

> **Share your world.**

Veyra is a content-first social platform designed for sharing photographs, writing thoughts, and discovering creators in a calm, tactile, and dependable environment. Built with an editorial visual identity, Veyra prioritizes authentic personal sharing, chronological discovery, accessible interfaces, and strict user privacy.

---

## Architecture Overview

- **Frontend:** React 18, Vite, JavaScript, Tailwind CSS, React Router, Lucide icons.
- **Backend (Privileged Service):** Node.js and Express deployed as serverless functions, handling ImageKit signing, validated media deletion, and administrative actions.
- **Database & Authentication:** Supabase PostgreSQL with strict Row Level Security (RLS) policies and Supabase Auth.
- **Media Storage & CDN:** ImageKit for responsive transformations and media delivery.
- **Deployment:** Netlify (static client build with SPA routing) and Vercel Functions (Express API).

---

## Repository Structure

```text
veyra/
├── client/                     # Vite + React frontend application
│   ├── public/                 # Static assets and SPA _redirects
│   ├── src/
│   │   ├── components/         # Accessible UI primitives (Button, Input, Dialog, etc.)
│   │   ├── routes/             # Public and authenticated page views
│   │   ├── styles/             # Tailwind CSS tokens and themes
│   │   └── test/               # Component and navigation test suites
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Node.js + Express privileged API
│   ├── src/
│   │   ├── config/             # Environment validation
│   │   ├── middleware/         # Security headers, CORS, rate limits, error handlers
│   │   ├── routes/             # Health, media auth, and admin endpoints
│   │   ├── tests/              # Supertest integration tests
│   │   ├── app.js              # Express application factory
│   │   └── index.js            # Server entrypoint
│   └── package.json
├── supabase/                   # Database migrations and seed scripts
│   └── migrations/
├── .env.example                # Canonical environment variable template
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js `v20+` or `v24+`
- npm `v10+` or `v11+`
- A Supabase project and ImageKit account for subsequent phases

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd CodeAlpha_SocialMediaPlatform
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Install dependencies:**
   ```bash
   # Install client dependencies
   npm --prefix client install

   # Install server dependencies
   npm --prefix server install
   ```

4. **Run development servers:**
   ```bash
   # Start the client (Vite on http://localhost:5173)
   npm run dev:client

   # Start the server (Express on http://localhost:5000)
   npm run dev:server
   ```

5. **Run test suites:**
   ```bash
   # Run client tests
   npm run test:client

   # Run server tests
   npm run test:server
   ```

---

## Implementation Status

- **Phase 0 (Architecture & Security Review):** Complete.
- **Phase 1 (Foundation, Design Tokens & Public Shell):** Complete.
  - Client and Express server initialized.
  - Semantic design tokens, typography, and light/dark theme toggling implemented.
  - Accessible UI primitives: Button, Input, Dialog, Toast, Skeleton, EmptyState.
  - Public pages: Landing page (`/`), Terms (`/terms`), Privacy Notice (`/privacy`), 404 (`/404`), and responsive auth shells.
  - Server application factory with Helmet security headers, CORS allowlist, and health check.
- **Phase 2 (Database Schema, Migrations, RLS & Authentication):** Next.

