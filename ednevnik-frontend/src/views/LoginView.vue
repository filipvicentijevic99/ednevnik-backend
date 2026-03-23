<template>
  <section class="card narrow-card">
    <p class="eyebrow">Authentication</p>
    <h2>Sign in</h2>
    <p class="muted">Use the seeded admin account or any user created through the admin panel.</p>

    <form class="stack" @submit.prevent="submit">
      <label class="field">
        <span>Email</span>
        <input v-model="form.email" type="email" autocomplete="username" required />
      </label>

      <label class="field">
        <span>Password</span>
        <input v-model="form.password" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">
        {{ loading ? "Signing in..." : "Login" }}
      </button>
    </form>

    <div class="hint">
      <strong>Seeded admin</strong>
      <span>admin@ednevnik.local / Admin123!</span>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const form = reactive({
  email: "admin@ednevnik.local",
  password: "Admin123!",
});

const loading = ref(false);
const error = ref("");

async function submit() {
  loading.value = true;
  error.value = "";

  try {
    await auth.login(form);
    await auth.refreshCurrentUser();
    router.push("/dashboard");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>
