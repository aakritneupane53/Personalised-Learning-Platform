import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  failedQueue = [];
};

// Global callback register for Query Cache clearing on auth refresh failures
let onRefreshFailedCallback: (() => void) | null = null;

export const registerOnRefreshFailed = (callback: () => void) => {
  onRefreshFailedCallback = callback;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Login/register failures (bad email or password) should surface as-is,
    // never trigger a token refresh cycle.
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    // If the refresh request itself fails, reject immediately so we don't
    // recurse into another refresh attempt.
    if (originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors and prevent infinite loops on the refresh endpoint
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: unknown) => {
              reject(err);
            },
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await api.post("/auth/refresh");
        const { accessToken } = response.data;

        useAuthStore.getState().setAccessToken(accessToken);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clear();

        if (onRefreshFailedCallback) {
          onRefreshFailedCallback();
        }

        // Clean redirect to login if we are in the client browser
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/register" &&
          window.location.pathname !== "/"
        ) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// Helper: parse and sanitize server errors for user-facing UI
export function parseServerError(error: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr: any = error;

  // Not an Axios error
  if (!axios.isAxiosError(anyErr)) {
    return "An unexpected error occurred. Please try again.";
  }

  const data = anyErr.response?.data;

  // Handle structured validation messages (NestJS often returns { message: [...] })
  if (data && typeof data === "object") {
    const msg = data.message;
    if (Array.isArray(msg) && msg.length > 0) {
      return sanitizeMessage(msg.join(" "));
    }
    if (typeof msg === "string") {
      return sanitizeMessage(msg);
    }
  }

  // Fallback to response message or axios error message
  const fallback = anyErr.response?.data?.message || anyErr.message || null;
  return fallback
    ? sanitizeMessage(String(fallback))
    : "An unexpected error occurred. Please try again.";
}

function sanitizeMessage(source: string): string {
  const s = source.toString();

  // Map common backend messages to friendly text
  if (
    s.includes("Refresh token missing") ||
    s.includes("Invalid or expired refresh token")
  ) {
    return "Your session expired. Please sign in again.";
  }

  if (s.includes("User with this email doesnot exist")) {
    return "No account found with that email.";
  }

  if (s.includes("Invalid Password")) {
    return "Incorrect password. Please try again.";
  }

  if (s.includes("Email already exists")) {
    return "An account with that email already exists.";
  }

  // Short validation messages are safe to show
  if (s.length < 200) return s;

  return "An unexpected error occurred. Please try again.";
}
