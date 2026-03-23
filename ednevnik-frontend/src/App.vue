<template>
  <div class="shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">School Admin</p>
        <h1>E-Dnevnik</h1>
      </div>

      <nav v-if="auth.isAuthenticated" class="nav">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink v-if="auth.user?.role === 'ADMIN'" to="/admin/users">Users</RouterLink>
        <button class="secondary-button" type="button" @click="logout">
          Logout
        </button>
      </nav>
    </header>

    <main class="page">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";

import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  auth.hydrate();
});

function logout() {
  auth.logout();
  router.push("/login");
}
</script>
