<template>
  <section class="grid two-column">
    <article class="card">
      <div class="section-header">
        <div>
          <p class="eyebrow">Admin</p>
          <h2>Student Enrollments</h2>
        </div>

        <button class="secondary-button" type="button" @click="loadAll" :disabled="loading">
          {{ loading ? "Refreshing..." : "Refresh" }}
        </button>
      </div>

      <p v-if="listError" class="error">{{ listError }}</p>

      <table class="table" v-if="enrollments.length">
        <thead>
          <tr>
            <th>Student</th>
            <th>Email</th>
            <th>Class</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="enrollment in enrollments" :key="enrollment.id">
            <td>{{ enrollment.student?.name }}</td>
            <td>{{ enrollment.student?.email }}</td>
            <td>
              <template v-if="editingId === enrollment.id">
                <select v-model="editingClassId">
                  <option v-for="item in classes" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </option>
                </select>
              </template>
              <template v-else>
                {{ enrollment.class?.name }}
              </template>
            </td>
            <td class="actions">
              <template v-if="editingId === enrollment.id">
                <button type="button" @click="saveEdit(enrollment.id)" :disabled="savingEdit">
                  {{ savingEdit ? "Saving..." : "Save" }}
                </button>
                <button class="secondary-button" type="button" @click="cancelEdit" :disabled="savingEdit">
                  Cancel
                </button>
              </template>
              <template v-else>
                <button type="button" @click="startEdit(enrollment)">Edit</button>
                <button
                  class="danger-button"
                  type="button"
                  @click="removeEnrollment(enrollment)"
                  :disabled="deletingId === enrollment.id"
                >
                  {{ deletingId === enrollment.id ? "Deleting..." : "Delete" }}
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="muted">No student enrollments yet.</p>
    </article>

    <article class="card">
      <p class="eyebrow">Create enrollment</p>
      <h2>Assign student to class</h2>

      <form class="stack" @submit.prevent="createEnrollment">
        <label class="field">
          <span>Student</span>
          <select v-model="form.studentId">
            <option disabled value="">Select student</option>
            <option v-for="student in students" :key="student.id" :value="student.id">
              {{ student.name }} ({{ student.email }})
            </option>
          </select>
        </label>

        <label class="field">
          <span>Class</span>
          <select v-model="form.classId">
            <option disabled value="">Select class</option>
            <option v-for="item in classes" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </label>

        <p v-if="formError" class="error">{{ formError }}</p>
        <p v-if="formSuccess" class="success">{{ formSuccess }}</p>

        <button type="submit" :disabled="submitting">
          {{ submitting ? "Saving..." : "Create enrollment" }}
        </button>
      </form>
    </article>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";

import { api } from "../lib/api";

const students = ref([]);
const classes = ref([]);
const enrollments = ref([]);
const loading = ref(false);
const listError = ref("");
const formError = ref("");
const formSuccess = ref("");
const submitting = ref(false);
const editingId = ref(null);
const editingClassId = ref("");
const savingEdit = ref(false);
const deletingId = ref(null);

const form = reactive({
  studentId: "",
  classId: "",
});

onMounted(() => {
  loadAll();
});

async function loadAll() {
  loading.value = true;
  listError.value = "";

  try {
    const [studentList, classList, enrollmentList] = await Promise.all([
      api.getUsers("STUDENT"),
      api.getClasses(),
      api.getEnrollments(),
    ]);

    students.value = studentList;
    classes.value = classList;
    enrollments.value = enrollmentList;
  } catch (err) {
    listError.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function createEnrollment() {
  submitting.value = true;
  formError.value = "";
  formSuccess.value = "";

  try {
    const created = await api.createEnrollment({
      studentId: Number(form.studentId),
      classId: Number(form.classId),
    });

    form.studentId = "";
    form.classId = "";
    formSuccess.value = `${created.student.name} enrolled into ${created.class.name}.`;
    await loadAll();
  } catch (err) {
    formError.value = err.message;
  } finally {
    submitting.value = false;
  }
}

function startEdit(enrollment) {
  editingId.value = enrollment.id;
  editingClassId.value = enrollment.class?.id ?? "";
}

function cancelEdit() {
  editingId.value = null;
  editingClassId.value = "";
}

async function saveEdit(id) {
  savingEdit.value = true;
  listError.value = "";
  formSuccess.value = "";

  try {
    const updated = await api.updateEnrollment(id, {
      classId: Number(editingClassId.value),
    });
    formSuccess.value = `${updated.student.name} moved to ${updated.class.name}.`;
    cancelEdit();
    await loadAll();
  } catch (err) {
    listError.value = err.message;
  } finally {
    savingEdit.value = false;
  }
}

async function removeEnrollment(enrollment) {
  deletingId.value = enrollment.id;
  listError.value = "";
  formSuccess.value = "";

  try {
    await api.deleteEnrollment(enrollment.id);
    formSuccess.value = `${enrollment.student.name} removed from ${enrollment.class.name}.`;
    if (editingId.value === enrollment.id) {
      cancelEdit();
    }
    await loadAll();
  } catch (err) {
    listError.value = err.message;
  } finally {
    deletingId.value = null;
  }
}
</script>
