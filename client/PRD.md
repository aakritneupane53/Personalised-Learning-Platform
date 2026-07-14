# Product Requirements Document: Frontend Authentication Module

## 1. Executive Summary

This document outlines the engineering specifications for the frontend authentication module of the application. The system is built on Next.js 16 (App Router) and interfaces with a NestJS backend. It employs a highly secure, memory-only access token architecture backed by HTTP-only refresh cookies, ensuring maximum protection against XSS and CSRF attacks while maintaining seamless user session persistence.

## 2. Goals and Scope

### Goals

* Implement a secure, persistent authentication flow without storing sensitive tokens in `localStorage` or accessible cookies.
* Provide a seamless user experience with silent background token refreshing.
* Prevent UI flickering during the initial application bootstrap phase.
* Ensure robust error handling and clear user feedback for all authentication states.

### Scope

* **In Scope:** Frontend implementation of Login, Registration, Logout, Session persistence (Refresh), Route protection, Axios interceptor setup, Zustand state management, and TanStack query integrations.
* **Out of Scope:** Backend NestJS implementation, OAuth/Social logins (unless specified later), password reset flows (to be detailed in a separate PRD).

## 3. Technology Stack

* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript
* **Network:** Axios
* **Data Fetching & Caching:** TanStack Query
* **State Management:** Zustand
* **Form Management:** React Hook Form
* **Validation:** Zod
* **UI/Styling:** shadcn/ui, Tailwind CSS
* **Backend Interface:** NestJS (JWT Access Token, HTTP-only Refresh Cookie)

## 4. Requirements

### Functional Requirements

1. **Registration & Login:** Users can create an account and log in using credentials.
2. **Session Persistence:** The application must automatically restore the user's session on reload via an HTTP-only refresh cookie.
3. **Route Protection:** Unauthenticated users attempting to access protected routes must be redirected to `/login`.
4. **Automatic Token Refresh:** The Axios client must automatically intercept 401 responses, refresh the token, and retry the failed requests.
5. **Logout:** Users can explicitly log out, which clears all local state, cache, and revokes the backend refresh cookie.
6. **Form Validation:** Client-side validation using Zod must mirror server requirements.

### Non-Functional Requirements

1. **Security:** Access tokens must live strictly in memory (Zustand). No tokens in `localStorage`, `sessionStorage`, or query cache.
2. **Performance:** The Axios interceptor must queue concurrent requests during a token refresh to prevent redundant network calls.
3. **UX:** The application must delay rendering protected content until the initial auth state is resolved to prevent UI flickering.

## 5. User Stories

* **US1:** As a returning user, I want my session to be remembered when I reopen the browser so I don't have to log in again.
* **US2:** As a user, I want clear inline error messages if I mistype my email or password so I can correct them easily.
* **US3:** As an unauthenticated user, I want to be redirected to the login page if I try to access the dashboard directly.
* **US4:** As a user leaving a shared computer, I want to log out securely, ensuring no one else can access my data.

## 6. Route Architecture

The application uses App Router layouts for protection, completely bypassing `middleware.ts` since tokens are not accessible in server-side cookies.

* **Public Routes:** * `/` (Root determines auth status and routes accordingly)
  * `/login`
  * `/register`
* **Protected Routes:**
  * `/dashboard`
  * Any other route nested under the protected layout group (e.g., `(app)`).

## 7. Authentication State Machine & Lifecycle

### State Machine

* `uninitialized`: App has just loaded, refresh check pending.
* `authenticated`: Access token in memory, profile loaded.
* `unauthenticated`: No valid session, or explicit logout.

### Initial Bootstrap Flow

1. App Starts -> `AuthProvider` mounts.
2. Triggers `POST /auth/refresh`.
3. **If Success:** Stores token in Zustand -> Executes `GET /profile` -> Renders Authenticated Layout.
4. **If Failure:** Sets status to `unauthenticated` -> Renders Guest Layout / Redirects to `/login`.

## 8. Detailed Component Specifications

### 8.1 Zustand Store (`useAuthStore`)

Responsible strictly for token and auth state. No user profile duplication.

```typescript
interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAccessToken: (token: string) => void;
  clear: () => void; // Clears token, sets isAuthenticated to false
  initialize: () => void; // Marks initial bootstrap as complete
}
## 8.2 TanStack Query Integration

### Queries
* **`useProfileQuery`**: Fetches user info using the Axios client and caches the profile data.

### Mutations
* **`useLoginMutation`**
* **`useRegisterMutation`**
* **`useLogoutMutation`**

> **CRITICAL CONSTRAINT:** Access/Refresh tokens must never be stored in the TanStack Query Cache under any circumstances.

---

## 8.3 Axios Client & Interceptor Design

### Request Interceptor
* Reads `accessToken` dynamically from the Zustand `useAuthStore`.
* Automatically injects the header: `Authorization: Bearer <token>` on all outbound protected API requests.

### Response Interceptor (401 Handler)
If a `401 Unauthorized` response is received:
1. **Pause request:** Immediately pause and intercept the failed request.
2. **Handle concurrency:**
   * If a token refresh process is **already in progress**, append this request's retry logic to a pending queue.
   * If **no** token refresh is currently in progress, lock the queue and initiate `POST /auth/refresh`.
3. **On Refresh Success:**
   * Update the Zustand store with the new `accessToken`.
   * Process and resolve all queued requests with the new token.
   * Retry the original failed request.
4. **On Refresh Failure:**
   * Clear the Zustand store state.
   * Clear the TanStack Query cache.
   * Flush the pending request queue, rejecting them with errors.
   * Perform a clean redirect to `/login`.

---

## 8.4 Protected Layout Behavior (`/app/layout.tsx` or similar)

* **Authentication Initialization:** Initializes the authentication lifecycle on layout mount.
* **Loading State:** Renders a full-page loading skeleton while the store's `isInitialized` state is `false`.
* **Route Guarding:** If `isAuthenticated` evaluates to `false` after initialization completes, trigger an immediate programmatical redirect to `/login` via `router.push()`.
* **Content Rendering:** Only renders `{children}` if `isAuthenticated` is `true` and the profile query has resolved successfully.

---

## 9. Sequence Diagrams

### Application Initialization
```mermaid
sequenceDiagram
    participant User
    participant App as Next.js App
    participant AuthProvider
    participant API as NestJS API

    User->>App: Visit /
    App->>AuthProvider: Mount Layout
    AuthProvider->>API: POST /auth/refresh (with HTTP-only cookie)
    alt Valid Cookie
        API-->>AuthProvider: 200 OK (New Access Token)
        AuthProvider->>AuthProvider: Update Zustand State
        AuthProvider->>API: GET /profile
        API-->>AuthProvider: 200 OK (User Data)
        AuthProvider->>App: Render Dashboard Layout
    else Invalid/No Cookie
        API-->>AuthProvider: 401 Unauthorized
        AuthProvider->>AuthProvider: Set Guest State
        AuthProvider->>App: Redirect to /login
    end ```
### Axios 401 Retry Flow
```mermaid
sequenceDiagram
    participant Client as Axios
    participant Interceptor
    participant AuthStore as Zustand
    participant API as NestJS API

    Client->>API: GET /api/protected (Expired Token)
    API-->>Interceptor: 401 Unauthorized
    Interceptor->>Interceptor: Pause Request, Add to Queue
    Interceptor->>API: POST /auth/refresh
    alt Refresh Success
        API-->>Interceptor: 200 OK (New Access Token)
        Interceptor->>AuthStore: setAccessToken(new_token)
        Interceptor->>Interceptor: Resume Queued Requests
        Interceptor->>API: GET /api/protected (New Token)
        API-->>Client: 200 OK (Data)
    else Refresh Fails
        API-->>Interceptor: 401/403 Error
        Interceptor->>AuthStore: clear()
        Interceptor->>Client: Reject all queued requests
        Interceptor->>Client: Trigger redirect to /login
    end
```

---

## 10. Folder Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx       # Auth boundary & bootstrap logic
│   │   └── dashboard/page.tsx
│   └── layout.tsx           # Global providers (TanStack, Toast)
├── components/
│   ├── auth/                # Login/Register forms
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── axios.ts             # Axios instance & interceptors
│   ├── queries/             # TanStack query definitions
│   │   └── auth.ts          # Profile, login, logout hooks
│   └── validations.ts       # Zod schemas
└── store/
    └── auth.store.ts        # Zustand auth state
```

---

## 11. Error Handling & Edge Cases

* **Validation Errors (400/422):** Caught automatically by `react-hook-form` via the Zod resolver and displayed inline underneath their corresponding inputs.
* **Authentication Errors (401):** Intercepted globally at the network level by Axios to initiate the silent background token refresh flow.
* **Authorization Errors (403):** Displays a user-friendly "Forbidden / Access Denied" fallback interface.
* **Conflict Errors (409):** Specifically intercepted in workflows like Registration (e.g., "Email already exists") and surfaced to the UI via global toast alerts or dedicated form field errors.
* **Server (500) & Network Failures:** Handled gracefully via global Toast alerts prompting: *"Service temporarily unavailable. Please check your internet connection."*
* **Concurrent Requests during Refresh:** Safely managed by the Axios response queueing logic. Ensures only a single `/auth/refresh` API request is made simultaneously, preventing duplicate refresh operations.
* **Manual Cookie Clears:** If cookies are manually cleared from the browser, the next authenticated request fails (401), the automatic silent refresh fails, and the user is instantly logged out and redirected.

---

## 12. Acceptance Criteria

* [ ] User can register and log in successfully, with client-side validation errors appearing inline based on the designated Zod schemas.
