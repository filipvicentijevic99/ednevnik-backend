import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { api } from "../lib/api";

const TOKEN_KEY = "ednevnik_token";
const USER_KEY = "ednevnik_user";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(null);
  const user = ref(null);

  const isAuthenticated = computed(() => Boolean(token.value));

  function hydrate() {
    if (!token.value) {
      token.value = localStorage.getItem(TOKEN_KEY);
    }

    if (!user.value) {
      const rawUser = localStorage.getItem(USER_KEY);
      user.value = rawUser ? JSON.parse(rawUser) : null;
    }
  }

  async function login(credentials) {
    const payload = await api.login(credentials);
    token.value = payload.accessToken;
    user.value = payload.user;
    localStorage.setItem(TOKEN_KEY, payload.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  }

  async function refreshCurrentUser() {
    const payload = await api.getMe();
    user.value = payload.user;
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    return payload.user;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  return {
    user,
    token,
    isAuthenticated,
    hydrate,
    login,
    logout,
    refreshCurrentUser,
  };
});
