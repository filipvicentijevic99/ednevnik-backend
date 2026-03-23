<template>
  <section class="grid">
    <article class="card">
      <p class="eyebrow">Session</p>
      <h2>Current user</h2>
      <p class="muted">This view reads the authenticated session from the backend `GET /me` endpoint.</p>

      <dl v-if="auth.user" class="details">
        <div>
          <dt>Name</dt>
          <dd>{{ auth.user.name || "N/A" }}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{{ auth.user.email || "N/A" }}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{{ auth.user.role }}</dd>
        </div>
        <div>
          <dt>ID</dt>
          <dd>{{ auth.user.id }}</dd>
        </div>
      </dl>

      <button type="button" @click="reload" :disabled="loading">
        {{ loading ? "Refreshing..." : "Refresh from API" }}
      </button>
    </article>

    <article class="card">
      <p class="eyebrow">Next step</p>
      <h2>What exists today</h2>
      <ul class="list">
        <li>Login via `POST /auth/login`</li>
        <li>Authenticated session check via `GET /me`</li>
        <li>Admin-only user management via `GET/POST /admin/users`</li>
      </ul>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref } from "vue";

import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const loading = ref(false);

onMounted(() => {
  reload();
});

async function reload() {
  loading.value = true;

  try {
    await auth.refreshCurrentUser();
  } finally {
    loading.value = false;
  }
}
</script>
