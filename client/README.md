# Personalised Learning Management System — Client

The frontend for the Personalised Learning Management System: a [Next.js 16](https://nextjs.org) (App Router) app where users generate AI-authored courses, work through lessons and quizzes, and track their progress on a dashboard.

> Looking for the backend? See [`../server/README.md`](../server/README.md). For the overall project (architecture, both apps together), see [`../README.md`](../README.md).

## Contents

- [Tech stack](#tech-stack)
- [How auth works](#how-auth-works)
- [API layer](#api-layer)
- [Routing](#routing)
- [Data fetching conventions](#data-fetching-conventions)
- [Project setup](#project-setup)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [Deployment](#deployment)
- [Folder structure](#folder-structure)

## Tech stack

| Concern | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router), React 19 |
| Language | TypeScript |
| Server state | [TanStack Query v5](https://tanstack.com/query/latest) — every API call lives in a `useQuery`/`useMutation` hook under `lib/queries/` |
| Client state | [Zustand](https://zustand-demo.pmnd.rs/) — just the auth store (`store/auth.store.ts`) |
| Forms & validation | [react-hook-form](https://react-hook-form.com/) + [Zod](https://zod.dev/) via `@hookform/resolvers` |
| HTTP | [Axios](https://axios-http.com/) with a response interceptor that handles token refresh (`lib/axios.ts`) |
| UI primitives | [Radix UI](https://www.radix-ui.com/) (via `radix-ui`) + `class-variance-authority` + `tailwind-merge` — shadcn-style composable components in `components/ui/` |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Icons | [lucide-react](https://lucide.dev/) |

## How auth works

The API issues a short-lived JWT **access token** (kept only in memory, in the Zustand store) plus a long-lived **refresh token** in an `httpOnly` cookie the browser handles automatically. The client never touches the refresh token directly.

1. **On every app load** (`components/auth/auth-provider.tsx`, mounted once in `app/providers.tsx`), the app immediately calls `POST /auth/refresh`. If the refresh cookie is valid, this returns a fresh access token and the user is silently signed in — no login form flash. If it fails, the auth store is cleared. Either way, `isInitialized` flips to `true` once this resolves.
2. **Route guarding** happens in the two route-group layouts, both of which just read the already-resolved state from the Zustand store — neither one re-triggers the bootstrap call:
   - `app/(protected)/layout.tsx` redirects to `/login` if not authenticated once initialization completes, and blocks render on an initialization/profile-loading skeleton until then.
   - `app/(auth)/layout.tsx` (login/register) redirects an already-authenticated user straight to `/dashboard`.
3. **Automatic token refresh on 401** (`lib/axios.ts`): the shared `api` Axios instance has a response interceptor that, on a `401` from any request other than `/auth/login`, `/auth/register`, or `/auth/refresh` itself, transparently calls `/auth/refresh`, retries the original request with the new token, and queues up any other requests that failed concurrently so they don't each trigger their own refresh. If the refresh call itself fails, the store is cleared, the React Query cache is wiped, and the user is redirected to `/login`.
4. **Logout** (`lib/queries/auth.ts`) calls `POST /auth/logout` (clears the server-side cookie), clears the store and query cache, and hard-navigates to `/login` either way (success or failure).

## API layer

All requests go through the singleton Axios instance in `lib/axios.ts`:

- `baseURL` is `NEXT_PUBLIC_API_URL` (falls back to `http://localhost:8000`).
- `withCredentials: true` — required so the refresh cookie is sent to the API's different origin in production.
- `parseServerError()` translates NestJS validation/error responses (`{ message: string | string[] }`) into a single user-facing string, with friendly overrides for a few known backend messages (expired session, wrong password, duplicate email, etc.) — use it in any new mutation's error UI instead of showing raw Axios errors.

Every resource has a matching hooks file in `lib/queries/`:

| File | Covers |
|---|---|
| `auth.ts` | profile, login, register, logout |
| `courses.ts` | list/detail/my-courses, create course, list modules |
| `course-content.ts` | lessons, quizzes, generate module content |
| `user-progress.ts` | mark lesson complete, module progress, dashboard summary |

Each file defines its own query keys and calls `queryClient.invalidateQueries` on the relevant keys after a mutation — e.g. creating a course invalidates the courses list, marking a lesson complete invalidates that module's progress and the dashboard summary.

## Routing

App Router route groups split the app into three zones:

```
app/
├── (auth)/              # public — login/register; redirects away if already authenticated
│   ├── login/
│   └── register/
├── (protected)/          # requires auth; wrapped in DashboardNav
│   └── dashboard/
│       ├── page.tsx                                    # overview + progress summary
│       └── courses/
│           ├── page.tsx                                # browse all courses
│           ├── my/page.tsx                              # courses you created
│           ├── new/page.tsx                             # AI course-creation form
│           └── [courseId]/
│               ├── page.tsx                              # course detail + module list
│               └── modules/[moduleId]/page.tsx           # lessons + quiz for a module
└── page.tsx              # public landing page
```

Route groups (`(auth)`, `(protected)`) don't appear in the URL — they only scope layouts.

## Data fetching conventions

- Server data always goes through a `lib/queries/*` hook — never call `api.get/post` directly from a component.
- Forms use `react-hook-form` with a `zodResolver` against a schema in `lib/validations.ts`, so client-side validation rules mirror the shape the API's `class-validator` DTOs expect (e.g. min password length, max field lengths).
- `QueryClient` (`app/providers.tsx`) has `refetchOnWindowFocus: false` and `retry: false` — failures surface immediately instead of silently retrying, which matters for auth-sensitive requests.

## Project setup

**Requirements**: Node.js 20+, and the [server](../server) running locally (or a deployed API URL to point at).

```bash
cd client
npm install
```

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Recommended | Base URL of the backend API. Falls back to `http://localhost:8000` if unset. |

`NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle **at build time** — setting them in a local `.env` file has no effect on a hosting provider's build. Set `NEXT_PUBLIC_API_URL` directly in your hosting provider's (e.g. Vercel) project settings for deployed environments.

## Running the app

```bash
npm run dev     # start the dev server at http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

With the default env values, the app expects the API at `http://localhost:8000` — start the [server](../server) first (or set `NEXT_PUBLIC_API_URL` to point elsewhere).

## Deployment

The app is deployed on [Vercel](https://vercel.com):

- Set `NEXT_PUBLIC_API_URL` to the deployed backend's origin (no trailing slash) in the Vercel project's environment variables.
- The backend's `CORS_ORIGIN` must include this app's exact deployed origin, and cookies require HTTPS in production (`SameSite=None; Secure` on the refresh cookie) — see the [server README](../server/README.md#deployment).
- No other backend-specific configuration is needed; `next build` / `next start` work as-is on Vercel's default Next.js pipeline.

## Folder structure

```
client/
├── app/
│   ├── (auth)/            # login/register pages + layout
│   ├── (protected)/        # dashboard pages + layout (route guard, nav)
│   ├── layout.tsx           # root layout: fonts, Providers
│   ├── providers.tsx         # QueryClientProvider + AuthProvider
│   └── page.tsx              # public landing page
├── components/
│   ├── auth/                 # session bootstrap provider
│   ├── courses/               # course form, cards, grid, module rows
│   ├── course-content/         # lesson/quiz list + AI generation gate
│   ├── dashboard/              # progress overview
│   ├── nav/                    # dashboard nav, profile panel
│   └── ui/                     # shadcn-style Radix primitives (button, card, badge, ...)
├── lib/
│   ├── axios.ts                # API client + refresh interceptor + error parsing
│   ├── queries/                 # one file per resource, all React Query hooks
│   ├── validations.ts            # Zod schemas shared by forms
│   ├── categories.ts             # course category enum + display metadata
│   └── utils.ts
├── store/
│   └── auth.store.ts             # Zustand: accessToken, isAuthenticated, isInitialized
└── .env.example
```
