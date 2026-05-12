import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { api } from "../lib/api";
import {
  clearStoredAuth,
  readStoredToken,
  readStoredUser,
  storeAuthSession,
  storeUser,
} from "../lib/auth-storage";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(null);
  const user = ref(null);

  const isAuthenticated = computed(() => Boolean(token.value));

  function hydrate() {
    if (!token.value) {
      token.value = readStoredToken();
    }

    if (!user.value) {
      user.value = readStoredUser();
    }

    if (!token.value && user.value) {
      user.value = null;
      clearStoredAuth();
    }
  }

  async function login(credentials) {
    const payload = await api.login(credentials);
    token.value = payload.accessToken;
    user.value = payload.user;
    storeAuthSession({ token: payload.accessToken, user: payload.user });
  }

  async function refreshCurrentUser() {
    const payload = await api.getMe();
    user.value = payload.user;
    storeUser(payload.user);
    return payload.user;
  }

  function logout() {
    token.value = null;
    user.value = null;
    clearStoredAuth();
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
