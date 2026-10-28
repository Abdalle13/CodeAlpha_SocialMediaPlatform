# Deployment and Environment Guide (Supabase)

## 1. Target topology
- Frontend: Netlify static Vite app (`client/dist`).
- Database and authentication: Supabase hosted project (PostgreSQL + Supabase Auth + RLS).
- Backend: Vercel Functions for Express routes that need trusted server-side credentials, especially ImageKit signing and protected admin actions.
- Media: ImageKit.
- Password recovery email: configure Supabase Auth SMTP/provider and templates.

Verify current provider documentation and free-tier limits before deployment.

## 2. Environment variables
Use `.env.example` placeholders only. Never commit `.env` or real credentials.

### Client (safe to expose only these public values)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (public/anon key; RLS must protect every table)
- `VITE_API_BASE_URL`
- `VITE_IMAGEKIT_PUBLIC_KEY` only if required by the upload SDK

### Server only
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` if needed for server-side user-scoped clients
- `SUPABASE_SERVICE_ROLE_KEY` only for narrowly scoped trusted server tasks; never expose in any `VITE_` variable, client bundle, logs or public repository
- `CLIENT_ORIGIN` and `ALLOWED_ORIGINS`
- `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`, `IMAGEKIT_UPLOAD_FOLDER`
- `NODE_ENV`, `PORT` (local development only)
- `ADMIN_BOOTSTRAP_SECRET` only if a documented one-time bootstrap truly requires it; do not maintain a permanent public bootstrap route

Do not add a separate Gmail SMTP credential to the app unless there is a documented server email feature. Password recovery should use Supabase Auth email configuration. Configure SMTP/provider and email templates in Supabase dashboard, and never reuse an exposed app password.

## 3. Supabase project setup
1. Create a Supabase project and keep development and production projects separate when feasible.
2. Copy Project URL and publishable/anon key into local environment; only trusted server environment may contain service-role key.
3. Add production Netlify URL and local URLs to Supabase Auth Site URL / allowed redirect URLs as appropriate. Avoid broad wildcard redirects in production.
4. Configure email confirmation and password recovery templates/provider. Test the actual inbox delivery and callback route.
5. Commit SQL migrations under `supabase/migrations/`; apply them to a development project first and verify a fresh setup.
6. Enable RLS on every exposed table and review each policy before adding production data.
7. Test with at least two separate user accounts; verify users cannot read or mutate each other's private data.
8. Configure backups/export strategy and check current project limits.

## 4. ImageKit
1. Create ImageKit account and configure public key, private key and URL endpoint.
2. Store private key only in server environment.
3. Express validates Supabase identity before returning short-lived upload signature/parameters.
4. Restrict file types, size, count, folders and asset naming. Verify ownership before deleting files.
5. Test invalid file, oversized file, failed upload, orphan cleanup and asset deletion.

## 5. Vercel server-side API
- Verify current Node runtime and Express Functions entrypoint requirements.
- Keep application creation separate from local listening.
- Configure server-only variables in Vercel settings for each environment.
- Add health endpoint and verify after deploy.
- Do not rely on local filesystem or process memory for durable state.
- Check logs for sanitized errors only; never log secrets or full auth tokens.

## 6. Netlify frontend
- Set the correct base directory/build command/publish directory for `client`.
- Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`, and public ImageKit key if needed.
- Configure SPA fallback for React Router.
- Add the deployed Netlify origin to Supabase Auth redirect allowlist and Express CORS allowlist.
- Never set `SUPABASE_SERVICE_ROLE_KEY` in Netlify client environment variables.

## 7. Remember Me, auth redirects and security
- Configure the Supabase client so checked Remember Me persists the session across browser restarts and unchecked uses session-scoped persistence, using supported SDK storage configuration. Do not hand-roll token storage.
- Verify password recovery from email opens the deployed callback, handles expired links, and returns to the reset-password page.
- Keep auth redirect URLs allow-listed.
- Use Supabase RLS for direct client access and server-side authorization for privileged Express routes.
- CORS is relevant to Express API routes; database access through Supabase client is governed by Supabase auth/RLS, not Express CORS.

## 8. Cross-device and cross-network release tests
Use a second phone/computer and a different network (e.g. mobile data):
- landing page and deep links load and refresh;
- registration, email confirmation if enabled, login, Remember Me, logout, password recovery;
- two users cannot access each other's private data;
- create/edit/delete post, upload image, follow, like, comment, save and search;
- messages are visible only to conversation participants;
- notifications and report/moderation permissions behave correctly;
- suspended users cannot write; admin actions are restricted;
- no console, RLS, auth redirect, mixed-content or CORS errors;
- repository and deployed client contain no private credentials.
