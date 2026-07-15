# Personalised Learning Management System — API

The backend for the Personalised Learning Management System: a [NestJS](https://nestjs.com/) REST API that generates AI-authored courses (outline → modules → lessons + quizzes), tracks per-user lesson progress, and serves it all to the [Next.js client](../client).

> Looking for the frontend? See [`../client/README.md`](../client/README.md). For the overall project (architecture, both apps together), see [`../README.md`](../README.md).

## Contents

- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [How course generation works](#how-course-generation-works)
- [Data model](#data-model)
- [API reference](#api-reference)
- [Project setup](#project-setup)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [Testing](#testing)
- [Deployment](#deployment)
- [Folder structure](#folder-structure)

## Tech stack

| Concern | Choice |
|---|---|
| Framework | [NestJS 11](https://nestjs.com/) (Express platform) |
| Language | TypeScript |
| Database | PostgreSQL ([Neon](https://neon.tech), serverless) via [TypeORM](https://typeorm.io) |
| Cache | [Upstash Redis](https://upstash.com/) (REST client, no persistent TCP connection needed) |
| Auth | JWT access + refresh tokens ([Passport](https://www.passportjs.org/) `passport-jwt`), [Argon2](https://github.com/ranisalt/node-argon2) password hashing |
| AI providers | [Groq](https://groq.com/) (primary + two fallback keys) → [Gemini](https://ai.google.dev/) (last-resort fallback) |
| Validation | `class-validator` / `class-transformer` for HTTP DTOs, [Zod](https://zod.dev/) for validating AI JSON output |
| Rate limiting | `@nestjs/throttler` |

## Architecture

The app is a single NestJS service organized into feature modules, each with its own controller/service/entities:

```
AppModule
├── ConfigModule        (global .env loading)
├── TypeOrmModule        (Postgres connection, autoLoadEntities + synchronize)
├── ThrottlerModule       (global rate limit: 60 req/min per IP)
├── RedisModule          (Upstash Redis client, exported for other modules)
├── UsersModule          (User entity + repository)
├── AuthModule           (register/login/refresh/logout, JWT strategy)
├── CourseModule         (Course + Module entities, AI-backed outline generation)
├── AiModule             (Groq/Gemini fallback chain, Zod-validated output)
├── CourseContentModule  (Lesson + QuizQuestion entities, AI-backed content generation)
└── UserProgressModule   (per-lesson completion tracking, cached dashboard summary)
```

Everything except `auth/register`, `auth/login`, `auth/refresh`, `auth/logout`, and the `/courses-test` probe endpoint requires a valid JWT (`JwtAuthGuard`, `@UseGuards`).

### Auth flow

- **Access token**: short-lived (15 min), signed with `JWT_ACCESS_SECRET`, returned in the JSON response body and expected as `Authorization: Bearer <token>` on subsequent requests. Never persisted server-side.
- **Refresh token**: long-lived (30 days), signed with `JWT_REFRESH_SECRET`, set as an `httpOnly` cookie (`refreshToken`) on `register`/`login`/`refresh`. `SameSite=None; Secure` in production (client and API live on different domains), `SameSite=Lax` and non-secure in development (both on `localhost`).
- `POST /auth/refresh` reads that cookie, verifies it, and issues a new access + refresh token pair (rotation on every refresh).
- `JwtStrategy` validates the access token on every guarded request, then looks the user up — first in Redis (`auth:user:<id>`, 60s TTL), falling back to Postgres on a cache miss. Only the password-stripped user object is ever cached.
- There's currently no "update user" endpoint, so there's no explicit cache invalidation path — a stale cached user can live for up to 60s after a DB change made outside this API.

## How course generation works

Course content is AI-generated in two stages, both going through `AiService` (`src/ai/ai.service.ts`):

1. **Outline** (`POST /courses`) — given a topic, skill level, and category, the AI returns a course title and 4–7 ordered modules. `CourseService.create` runs this in a single DB transaction: it persists the `Course` row and all `Module` rows together, so a course is never left half-created.
2. **Module content** (`POST /course-content/modules/:moduleId/generate`) — given a specific module, the AI returns 2–3 lessons and exactly 3 quiz questions. `CourseContentService.generateDeepContentForModule` first checks whether lessons already exist for that module (cache hit — skips the AI call entirely and returns the stored data), otherwise calls the AI and persists lessons + quiz questions transactionally. If the module being generated is the course's last module (by `orderIndex`), the course status flips from `draft` to `published` as part of the same transaction.

### Provider fallback chain

`AiService` never hard-fails on a single provider hiccup. Each generation call tries an ordered list of provider/model attempts, retrying each tier up to twice with a short backoff before moving to the next:

- **Outline generation**: Groq primary key (`llama-3.3-70b-versatile`) → Groq deep key 1 → Groq deep key 2 (`openai/gpt-oss-120b`) → Gemini (`gemini-2.5-flash`, only if `GEMINI_API_KEY` is set).
- **Module content generation**: same providers, tried deep-key-first (content generation is heavier, so the deeper models go first) → Groq primary → Gemini.

Every response is parsed as JSON and validated against a Zod schema (`schemas/course-outline.schema.ts`, `schemas/module-content.schema.ts`) before being trusted. A malformed or non-conforming response from one tier is treated as a failure and the chain moves on — the request only fails once every configured tier has been exhausted.

AI-backed endpoints (`POST /courses`, `POST /course-content/modules/:moduleId/generate`) are throttled to 3 requests/minute per IP, tighter than the global 60/minute default, since each call is an LLM request.

## Data model

| Entity | Table | Notes |
|---|---|---|
| `User` | `users` | email (unique), argon2 password hash, name, optional avatar URL |
| `Course` | `courses` | belongs to a `User`; `status` (`draft`/`published`/`archived`), `category` enum, raw AI outline stored in `raw_ai_output` (jsonb) |
| `ModuleEntity` | `modules` | belongs to a `Course`; ordered via `order_index` |
| `Lesson` | `lessons` | belongs to a `Module`; markdown `content`, `estimated_minutes`, optional `examples` |
| `QuizQuestionEntity` | `quiz_questions` | belongs to a `Module`; `options` (jsonb string array), `correct_answer` |
| `UserProgress` | `user_progress` | unique on `(user_id, lesson_id)` — one row per user/lesson pair, upserted on completion toggle |

Foreign keys cascade on delete (deleting a course removes its modules; deleting a module's lessons removes related progress rows, etc.), except `courses → modules`, which the service layer deletes manually inside the same transaction since the FK isn't set to cascade at the DB level.

**Schema management**: `TypeOrmModule` runs with `synchronize: true` — TypeORM diffs your entities against the live schema and applies changes automatically on boot. There are no migration files to run; pointing `NEON_DB` at an empty database and starting the app is enough to create every table. This is convenient for a small project but is not what you'd want against a production database with real traffic — be aware `synchronize: true` can drop/alter columns to match entity changes.

## API reference

All routes are prefixed with the server's base URL (no global `/api` prefix). Guarded routes require `Authorization: Bearer <accessToken>`.

### Auth — `/auth`

| Method | Route | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | – | `{ email, password, name, avatarUrl? }` | Creates a user, returns `{ accessToken }`, sets refresh cookie |
| POST | `/auth/login` | – | `{ email, password }` | Returns `{ accessToken }`, sets refresh cookie |
| POST | `/auth/refresh` | refresh cookie | – | Rotates and returns a new `{ accessToken }` |
| POST | `/auth/logout` | – | – | Clears the refresh cookie |
| GET | `/auth/profile` | JWT | – | Returns the authenticated user (no password) |

### Courses — `/courses`

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/courses` | JWT | `{ title, topic, skillLevel, category?, status? }` — generates the outline via AI and creates the course + modules (throttled 3/min) |
| GET | `/courses?category=` | JWT | List all courses, optionally filtered by category |
| GET | `/courses/:id` | JWT | Single course (includes owning user) |
| GET | `/courses/user/me` | JWT | Courses owned by the authenticated user |
| PATCH | `/courses/:id` | JWT | Update a course (owner only) |
| DELETE | `/courses/:id` | JWT | Delete a course and its modules (owner only), `204` |
| GET | `/courses/modules/:courseId` | JWT | Modules for a course, ordered by `orderIndex` |

### Course content — `/course-content`

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/course-content/modules/:moduleId/generate` | JWT | Generates (or returns cached) lessons + quiz for a module (owner only, throttled 3/min); marks the course `published` if this was the last module |
| GET | `/course-content/modules/:moduleId/lessons` | JWT | Lessons for a module, ordered |
| GET | `/course-content/modules/:moduleId/quizzes` | JWT | Quiz questions for a module |
| GET | `/course-content/lessons/:id` | JWT | Single lesson |
| GET | `/course-content/quizzes/:id` | JWT | Single quiz question |

### User progress — `/user-progress`

| Method | Route | Auth | Notes |
|---|---|---|---|
| PATCH | `/user-progress/lessons/:lessonId` | JWT | `{ completed: boolean }` — upserts the progress row, invalidates the cached summary |
| GET | `/user-progress/lessons/:lessonId` | JWT | Progress for one lesson (`null` if not started) |
| GET | `/user-progress/modules/:moduleId` | JWT | Progress across every lesson in a module |
| GET | `/user-progress/me` | JWT | All progress rows for the authenticated user |
| GET | `/user-progress/summary` | JWT | Dashboard summary: overall stats + per-course completion breakdown, cached in Redis for 45s |

### Misc

| Method | Route | Auth | Notes |
|---|---|---|---|
| GET | `/health` | – | Liveness check |
| GET | `/redis` | – | Pings the Redis connection |
| POST | `/courses-test/generate` | – | `{ topic, skillLevel, category }` — calls the AI outline generator directly and returns the raw validated JSON, without touching the database. Useful for testing the AI fallback chain in isolation; not used by the frontend |

## Project setup

**Requirements**: Node.js 24+, a reachable PostgreSQL database (e.g. a free [Neon](https://neon.tech) project), and an [Upstash Redis](https://upstash.com/) database (REST API, not the TCP endpoint).

```bash
cd server
npm install
```

## Environment variables

Copy `.env.example` to `.env.development.local` (used automatically in dev — see `envFilePath` in `app.module.ts`) and fill in real values:

| Variable | Required | Description |
|---|---|---|
| `NEON_DB` | Yes | Postgres connection string, must be reachable from wherever the app runs |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST token |
| `JWT_ACCESS_SECRET` | Yes | Signing secret for access tokens |
| `JWT_REFRESH_SECRET` | Yes | Signing secret for refresh tokens |
| `GROQ_API_KEY` | Yes | Primary Groq API key |
| `GROQ_DEEP_API_KEY1` | Yes | First fallback Groq key (independent account/quota recommended) |
| `GROQ_DEEP_API_KEY2` | Yes | Second fallback Groq key |
| `GEMINI_API_KEY` | No | Last-resort fallback provider; if unset, the Gemini tier is simply skipped |
| `CORS_ORIGIN` | Recommended | Comma-separated list of allowed frontend origins, no trailing slashes (defaults to `http://localhost:3000` if unset) |
| `PORT` | No | Defaults to `8000` locally; Render sets this automatically in production |

Generate strong random values for the JWT secrets, e.g.:

```bash
openssl rand -base64 32
```

## Running the app

```bash
npm run start          # standard start
npm run start:dev      # watch mode (recommended for local dev)
npm run start:debug    # watch mode with the Node inspector attached
npm run start:prod     # runs the compiled dist/main.js (run `npm run build` first)
```

The API listens on `http://localhost:8000` by default. Because `synchronize: true` is on, the first successful boot against an empty database creates every table for you — no separate migration step.

## Testing

```bash
npm run test         # unit tests (*.spec.ts, colocated with source)
npm run test:watch   # watch mode
npm run test:cov     # coverage report
npm run test:e2e     # end-to-end tests (test/jest-e2e.json)
```

## Deployment

The included `Dockerfile` is a three-stage build (`deps` → `build` → `runtime`) producing a slim `node:24-alpine` image that runs `node dist/main`. The project is deployed as a Docker web service on [Render](https://render.com):

- Set every variable from [Environment variables](#environment-variables) in Render's dashboard — `.env*` files are not deployed (they're gitignored).
- Render sets `PORT` automatically; the app reads it via `ConfigService`.
- `NODE_ENV=production` is baked into the Dockerfile's runtime stage, which also drives cookie behavior (`SameSite=None; Secure` for the refresh cookie) and disables the CORS localhost fallback.
- `main.ts` sets `trust proxy: 1` since Render sits behind a reverse proxy — without it, `ThrottlerGuard`'s per-IP limiting would see every request as coming from the proxy and rate-limit all clients together.
- `CORS_ORIGIN` must list your deployed frontend's exact origin (see the [client README](../client/README.md#deployment)).

```bash
docker build -t plms-server .
docker run -p 8000:8000 --env-file .env.production plms-server
```

## Folder structure

```
server/
├── src/
│   ├── auth/              # register/login/refresh/logout, JWT strategy, guards
│   ├── users/              # User entity + repository
│   ├── course/             # Course + Module entities, CRUD, AI outline generation
│   ├── course-content/     # Lesson + QuizQuestion entities, AI content generation
│   ├── user-progress/      # per-lesson completion tracking, cached summary
│   ├── ai/                 # Groq/Gemini fallback chain + Zod output schemas
│   ├── redis/               # Upstash Redis client wrapper
│   ├── app.module.ts        # wires everything together (Config, TypeORM, Throttler)
│   └── main.ts              # bootstrap: CORS, cookies, global ValidationPipe, trust proxy
├── test/                    # e2e tests
├── Dockerfile
└── .env.example
```
