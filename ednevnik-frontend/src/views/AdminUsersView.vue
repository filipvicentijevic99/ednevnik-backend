<template>
  <section class="grid two-column">
    <article class="card">
      <div class="section-header">
        <div>
          <p class="eyebrow">Admin</p>
          <h2>Users</h2>
        </div>

        <select v-model="filterRole" @change="loadUsers">
          <option value="">All roles</option>
          <option value="TEACHER">Teachers</option>
          <option value="STUDENT">Students</option>
        </select>
      </div>

      <p v-if="listError" class="error">{{ listError }}</p>

      <table class="table" v-if="users.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.role }}</td>
            <td>{{ formatDate(user.createdAt) }}</td>
          </tr>
        </tbody>
      </table>

      <p v-else class="muted">No users found for the selected filter.</p>
    </article>

    <article class="card">
      <p class="eyebrow">Create user</p>
      <h2>New teacher or student</h2>

      <form class="stack" @submit.prevent="createUser">
        <label class="field">
          <span>Name</span>
          <input v-model="form.name" required />
        </label>

        <label class="field">
          <span>Email</span>
          <input v-model="form.email" type="email" required />
        </label>

        <label class="field">
          <span>Password</span>
          <input v-model="form.password" type="password" required />
        </label>

        <label class="field">
          <span>Role</span>
          <select v-model="form.role">
            <option value="TEACHER">Teacher</option>
            <option value="STUDENT">Student</option>
          </select>
        </label>

        <p v-if="formError" class="error">{{ formError }}</p>
        <p v-if="formSuccess" class="success">{{ formSuccess }}</p>

        <button type="submit" :disabled="submitting">
          {{ submitting ? "Creating..." : "Create user" }}
        </button>
      </form>
    </article>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";

import { api } from "../lib/api";

const users = ref([]);
const filterRole = ref("");
const listError = ref("");
const formError = ref("");
const formSuccess = ref("");
const submitting = ref(false);

const form = reactive({
  name: "",
  email: "",
  password: "",
  role: "TEACHER",
});

onMounted(() => {
  loadUsers();
});

async function loadUsers() {
  listError.value = "";

  try {
    users.value = await api.getUsers(filterRole.value);
  } catch (err) {
    listError.value = err.message;
  }
}

async function createUser() {
  submitting.value = true;
  formError.value = "";
  formSuccess.value = "";

  try {
    const created = await api.createUser(form);
    formSuccess.value = `Created ${created.role.toLowerCase()} ${created.email}.`;
    form.name = "";
    form.email = "";
    form.password = "";
    form.role = "TEACHER";
    await loadUsers();
  } catch (err) {
    formError.value = err.message;
  } finally {
    submitting.value = false;
  }
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}
</script>
