"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserState = {
  token: string | null;
  username: string | null;
  setSession: (token: string, username: string) => void;
  clear: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      setSession: (token, username) =>
        set({
          token,
          username,
        }),
      clear: () =>
        set({
          token: null,
          username: null,
        }),
    }),
    {
      name: "cola.session",
    },
  ),
);
