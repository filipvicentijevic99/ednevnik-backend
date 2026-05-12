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
        <RouterLink v-if="auth.user?.role === 'ADMIN'" to="/admin/classes">Classes</RouterLink>
        <RouterLink v-if="auth.user?.role === 'ADMIN'" to="/admin/subjects">Subjects</RouterLink>
        <RouterLink v-if="auth.user?.role === 'ADMIN'" to="/admin/enrollments">Enrollments</RouterLink>
        <RouterLink v-if="auth.user?.role === 'ADMIN'" to="/admin/assignments">Assignments</RouterLink>
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
import { onMounted, onUnmounted } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";

import { UNAUTHORIZED_EVENT } from "./lib/auth-storage";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
const router = useRouter();

function handleUnauthorized() {
  auth.logout();
  router.push("/login");
}

onMounted(() => {
  auth.hydrate();
  window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
});

onUnmounted(() => {
  window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
});

function logout() {
  auth.logout();
  router.push("/login");
}
</script>
