# Veyra

> **Share your world.**

Veyra is a content-first social platform designed for sharing photographs, writing thoughts, and discovering creators in a calm, tactile, and dependable environment. Built with an editorial visual identity, Veyra prioritizes authentic personal sharing, chronological discovery, accessible interfaces, and strict user privacy.

---

## Architecture Overview

Veyra is engineered as a secure, distributed web application separating client presentation, direct database operations governed by PostgreSQL Row Level Security (RLS), and a privileged serverless API for media authorization and administrative enforcement.

* **Frontend:** React 18, Vite, JavaScript, Tailwind CSS, React Router v6, Lucide icons.
* **Backend API (Privileged Service):** Node.js and Express running serverless functions, handling ImageKit signed upload tokens, verified media deletion, and audited administrative actions.
* **Database & Authentication:** Supabase PostgreSQL 15+ with strict Row Level Security policies, database-level functions, constraints, and Supabase Auth.
* **Media Storage & CDN:** ImageKit for signed uploads, automated WebP/AVIF transformation, and global content delivery.
* **Hosting & Deployment:** Netlify (static client build with SPA redirect routing) and Vercel Functions (Express API).

```
                      +-----------------------------+
                      |         Veyra Client        |
                      |   (React 18 / Vite / SPA)   |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             | (Direct with JWT)                             | (Signed Media & Admin)
             v                                               v
+----------------------------+                 +----------------------------+
|   Supabase PostgreSQL      |                 |   Veyra Express API        |
|   - Row Level Security     |                 |   (Node.js / Vercel API)   |
|   - Supabase Auth          |                 +--------------+-------------+
|   - Realtime Subscriptions |                                |
|   - RPC Direct Convos      |                                v
+----------------------------+                 +----------------------------+
                                               |    ImageKit Storage & CDN  |
                                               +----------------------------+
```

---

## Complete Feature Matrix

### 1. Authentication and Session Management
* Email and password registration with strict confirmation matching and minimum length validation.
* Login with atomic Remember Me preference migration between localStorage and sessionStorage without token race conditions.
* Password recovery flow with honest error handling for expired or invalid recovery tokens.
* Protected routes with immediate session restoration and automatic token refresh.

### 2. Profiles and Social Graph
* Custom public handles (`@username`), display names, biographies, and external website links.
* High-resolution avatar and cover photo uploads powered by ImageKit.
* Follow and unfollow relationships with interactive followers and following modal lists.
* Bidirectional user blocking with database-level isolation preventing blocked parties from querying each other's content.

### 3. Core Social Features
* **Post Creation:** Multi-image uploads with live file previews, caption formatting (up to 2000 characters), and audience control (Public or Followers only).
* **Home Feed:** Chronological stream with cursor-based pagination (`created_at` cursor), manual refresh control, and friendly empty states.
* **Post Card:** Interactive cards featuring responsive multi-photo grids, image lightbox viewer, optimistic likes with count rollback, private bookmarking, shareable deep links, and author action menu (edit post, delete post).
* **Threaded Discussions:** Comments thread supporting nested replies, timestamp formatting, optimistic comment posting with automatic error rollback, and deletion rights for both comment authors and post owners.
* **Explore Gallery:** Platform-wide content discovery featuring debounced live search and dual view modes (Stories feed view and Visual photo gallery).
* **Saved Posts:** Private bookmark archive accessible only to the authenticated owner.

### 4. Real-Time Activity and Notifications
* Real-time notifications for likes, comments, follows, and direct messages via Supabase channels.
* Dynamic unread badge counter in the navigation bar.
* Ability to mark single notifications as read or mark all as read simultaneously.

### 5. Direct Messaging (DMs)
* Private one-on-one direct messaging threads powered by PostgreSQL functions (`start_or_get_direct_conversation`).
* Real-time message exchange with auto-scroll and delivery timestamps.
* Split-pane desktop view and responsive mobile conversation switcher.
* Member search modal to start conversations with any active user on the platform.

### 6. Trust, Safety, and Moderation
* Content and member reporting modal accessible from posts and user profiles with categorized violation reasons.
* Dedicated Admin Moderation Console (`/admin`) reserved for verified administrator accounts.
* Real-time reports queue with one-click report resolution, dismissal, or direct action.
* Audited moderation actions: Suspend user account, reactivate user account, hide post, and restore post with mandatory logged justification.

### 7. Account Settings and Accessibility
* Dedicated settings section (`/settings/profile`) with tabs for profile customization and security credentials.
* In-app password update tool with strength verification.
* WCAG compliant color contrast across light (`#F8F8F5`) and dark (`#111713`) themes, keyboard navigation support, and zero em dashes throughout all interface copy.

---

## Repository Structure

```text
veyra/
├── client/                     # Vite + React frontend application
│   ├── public/                 # Static assets and SPA _redirects
│   ├── src/
│   │   ├── components/         # Accessible UI primitives (Button, Input, Dialog, etc.)
│   │   ├── features/
│   │   │   ├── auth/           # Authentication context and storage adapter
│   │   │   ├── media/          # ImageKit upload and client utilities
│   │   │   ├── messages/       # Messaging state and real-time hook
│   │   │   ├── moderation/     # User reporting modal
│   │   │   ├── notifications/  # Activity notifications hook
│   │   │   ├── posts/          # PostComposer, PostCard, CommentThread, hooks
│   │   │   └── profiles/       # Profile management and follow modals
│   │   ├── lib/                # API client and Supabase browser client
│   │   ├── routes/             # All application page views
│   │   ├── styles/             # Tailwind tokens and CSS variables
│   │   └── test/               # Component and integration test suites
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Node.js + Express privileged API
│   ├── src/
│   │   ├── config/             # Environment validation and ImageKit configuration
│   │   ├── middleware/         # Security headers, CORS, rate limits, auth
│   │   ├── routes/             # Health, media signing, and moderation endpoints
│   │   ├── tests/              # Unit and integration tests
│   │   ├── app.js              # Express application factory
│   │   └── index.js            # Server entrypoint
│   └── package.json
├── supabase/                   # Database migrations
│   └── migrations/
│       ├── 00001_initial_schema.sql
│       ├── 00002_rls_and_security.sql
│       ├── 00003_phase4_social_features.sql
│       └── 00004_admin_and_moderation.sql
├── docs/                       # Project architecture and design specifications
├── .env.example                # Canonical environment variable template
├── .gitignore
└── README.md
```

---

## Database Migrations

The database schema is managed through ordered SQL migrations in `supabase/migrations/`:

1. `00001_initial_schema.sql`: Core tables (`profiles`, `posts`, `post_media`, `likes`, `saved_posts`, `comments`, `follows`, `blocks`, `notifications`, `conversations`, `conversation_participants`, `messages`, `reports`, `moderation_actions`, `admin_users`).
2. `00002_rls_and_security.sql`: Row Level Security enabled on every table, helper functions (`is_admin`, `is_active_user`, `is_conversation_participant`, `start_or_get_direct_conversation`), and privilege enforcement.
3. `00003_phase4_social_features.sql`: Recursive-safe comment parent validation, bidirectional block verification, post media RLS, and post author moderation privileges.
4. `00004_admin_and_moderation.sql`: Admin query access on `admin_users`, report resolution policies, and post/profile moderation update policies.
5. `00005_notification_triggers.sql`: Automated database triggers for likes, comments, follows, and direct message notifications.
6. `00006_resolve_login_identity.sql`: Secure RPC function for identifier resolution supporting both email and username logins.

---

## Environment Variables

Copy `.env.example` to `.env` in both client and server directories:

### Client (`client/.env`)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5000/api
VITE_IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
```

### Server (`server/.env`)
```bash
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
IMAGEKIT_PUBLIC_KEY=your-imagekit-public-key
IMAGEKIT_PRIVATE_KEY=your-imagekit-private-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.netlify.app
```

---

## Local Development

```bash
# 1. Install client and server packages
npm --prefix client install
npm --prefix server install

# 2. Run client development server (http://localhost:5173)
npm --prefix client run dev

# 3. Run server development process (http://localhost:5000)
npm --prefix server run dev
```

---

## Production Build

```bash
# Build the client bundle
npm --prefix client run build
```

The compiled assets will be written to `client/dist/`, ready for hosting on Netlify.
