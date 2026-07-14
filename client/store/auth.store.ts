import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAccessToken: (token: string) => void;
  clear: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,
  setAccessToken: (token: string) =>
    set({
      accessToken: token,
      isAuthenticated: true,
    }),
  clear: () =>
    set({
      accessToken: null,
      isAuthenticated: false,
    }),
  initialize: () =>
    set({
      isInitialized: true,
    }),
}));
