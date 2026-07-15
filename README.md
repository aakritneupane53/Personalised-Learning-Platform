# Personalised Learning Management System

An AI-powered learning platform: describe a topic and skill level, and the system generates a structured course — modules, lessons, and quizzes — then tracks your progress through it lesson by lesson.

This repo holds two independently deployable apps:

| App | Path | Stack | Docs |
|---|---|---|---|
| API | [`server/`](server) | NestJS 11, PostgreSQL (Neon) + TypeORM, Upstash Redis, JWT auth | [`server/README.md`](server/README.md) |
| Web | [`client/`](client) | Next.js 16 (App Router), React 19, TanStack Query, Zustand | [`client/README.md`](client/README.md) |

This file covers the project as a whole. For endpoint-by-endpoint API docs, the data model, or the AI provider fallback chain, see the server README. For routing, auth flow on the frontend, or the API-hook conventions, see the client README.

## Contents

- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running both apps](#running-both-apps)
- [Deployment](#deployment)
- [Repository layout](#repository-layout)

## What it does

1. **Sign up / log in** — email + password, JWT-based session (server-issued access + refresh tokens).
2. **Create a course** — give the AI a topic, skill level, and category; it generates a title and 4–7 ordered modules and saves them immediately.
3. **Generate module content on demand** — open a module and generate its lessons + quiz with AI; once generated, it's cached in the database and never regenerated.
4. **Work through lessons** — mark lessons complete as you go; the last module's content generation automatically publishes the course.
5. **Track progress** — a dashboard summary shows overall and per-course completion, backed by a short-lived Redis cache so it stays fast under repeat visits.

## Architecture

```
┌─────────────────┐        HTTPS + cookies        ┌──────────────────┐
│  Next.js client  │ ─────────────────────────────▶ │   NestJS API      │
│  (Vercel)         │ ◀───────────────────────────── │   (Render, Docker)│
└─────────────────┘        JSON + refresh cookie    └──────────────────┘
                                                              │
                                    ┌─────────────────────────┼─────────────────────────┐
                                    ▼                          ▼                          ▼
                            ┌───────────────┐         ┌────────────────┐        ┌──────────────────┐
                            │  PostgreSQL     │         │  Upstash Redis   │        │  Groq / Gemini      │
                            │  (Neon)          │         │  (REST client)    │        │  (course/module AI)  │
                            └───────────────┘         └────────────────┘        └──────────────────┘
```

- **Client and API are separate origins** in production (Vercel + Render), so auth uses a cross-site refresh cookie (`SameSite=None; Secure`) plus an in-memory access token — see [`client/README.md#how-auth-works`](client/README.md#how-auth-works) and [`server/README.md#auth-flow`](server/README.md#auth-flow).
- **Database schema is TypeORM-managed** (`synchronize: true`) — no migration step; the API creates its own tables on first boot against an empty database.
- **AI generation never hard-fails on one provider** — course and module content generation fall through an ordered chain of Groq keys/models, with Gemini as an optional last resort. Full detail in [`server/README.md#how-course-generation-works`](server/README.md#how-course-generation-works).
- **Redis is used for caching, not as a source of truth** — cached user lookups on every authenticated request, and a short-lived cached dashboard summary that's invalidated on every progress update.

## Getting started

**Requirements**: Node.js 20+ (24+ for the server), a PostgreSQL database (a free [Neon](https://neon.tech) project works well), an [Upstash Redis](https://upstash.com/) database, and at least one [Groq](https://groq.com/) API key.

```bash
git clone <this repo>
cd Personalised-Learning-Management-System

# Backend
cd server
npm install
cp .env.example .env.development.local   # fill in real values, see below
npm run start:dev                          # http://localhost:8000

# Frontend (in a second terminal)
cd client
npm install
cp .env.example .env.local                 # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                                  # http://localhost:3000
```

Because the API runs with `synchronize: true`, pointing it at an empty Postgres database is enough — it creates every table on first boot. No seed data or migration step is required to get a working app; just register a user through the UI.

## Environment variables

Each app has its own `.env.example` with inline documentation. Summary:

**`server/.env.example`**: `NEON_DB`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GROQ_API_KEY` (+ two fallback keys), `GEMINI_API_KEY` (optional), `CORS_ORIGIN`. Full table: [`server/README.md#environment-variables`](server/README.md#environment-variables).

**`client/.env.example`**: `NEXT_PUBLIC_API_URL`. Details: [`client/README.md#environment-variables`](client/README.md#environment-variables).

Neither app's real `.env*` files are committed — only the `.example` templates. Never commit real secrets; rotate any key that does end up in git history.

## Running both apps

The two apps aren't in an npm/turborepo workspace — there's no root `package.json`. Run each with its own `npm install` / dev script from its own directory, in two terminals, as shown above. The client's `NEXT_PUBLIC_API_URL` must point at wherever the server is actually running, and the server's `CORS_ORIGIN` must list the client's exact origin.

## Deployment

| App | Platform | Notes |
|---|---|---|
| API | [Render](https://render.com) (Docker) | Three-stage `server/Dockerfile`; env vars set in Render's dashboard, not via `.env` files. Details: [`server/README.md#deployment`](server/README.md#deployment). |
| Web | [Vercel](https://vercel.com) | Standard Next.js build; `NEXT_PUBLIC_API_URL` set in Vercel's project settings (it's inlined at build time, so a local `.env` has no effect on the deployed build). Details: [`client/README.md#deployment`](client/README.md#deployment). |

Both deployments need to agree with each other: the server's `CORS_ORIGIN` must include the client's deployed origin, and the client's `NEXT_PUBLIC_API_URL` must point at the server's deployed origin. Since they're on different domains, the refresh-token cookie relies on `SameSite=None; Secure`, which requires both sides to be served over HTTPS.

## Repository layout

```
.
├── server/     # NestJS API — see server/README.md
├── client/     # Next.js app — see client/README.md
└── README.md   # you are here
```
