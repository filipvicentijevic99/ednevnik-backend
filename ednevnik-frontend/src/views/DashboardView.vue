<template>
  <section class="grid">
    <article class="card">
      <p class="eyebrow">Your account</p>
      <h2>Welcome, {{ auth.user?.name || 'student' }}</h2>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

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
        {{ loading ? "Refreshing..." : "Refresh account" }}
      </button>
    </article>

    <article class="card">
      <p class="eyebrow">Workspace</p>
      <template v-if="auth.user?.role === 'ADMIN'">
        <h2>Manage your school</h2>
        <p class="muted">Set up classes and subjects, enroll students, and assign teachers. Open the gradebook to review and manage grades.</p>
        <div class="actions">
          <RouterLink class="action-link" to="/admin/users">Manage users</RouterLink>
          <RouterLink class="action-link" to="/admin/enrollments">Enroll students</RouterLink>
          <RouterLink class="action-link" to="/admin/assignments">Assign teachers</RouterLink>
          <RouterLink class="action-link" to="/gradebook">Open gradebook</RouterLink>
        </div>
      </template>
      <template v-else-if="auth.user?.role === 'TEACHER'">
        <h2>Your teaching workspace</h2>
        <p class="muted">Choose an assigned class and subject to view students and record grades.</p>
        <RouterLink class="action-link" to="/gradebook">Open gradebook</RouterLink>
      </template>
      <template v-else>
        <h2>Student account</h2>
        <p class="muted">Your account is ready. Student grade viewing is planned for the next milestone.</p>
      </template>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const loading = ref(false);
const error = ref("");

onMounted(() => {
  reload();
});

async function reload() {
  loading.value = true;
  error.value = "";

  try {
    await auth.refreshCurrentUser();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
