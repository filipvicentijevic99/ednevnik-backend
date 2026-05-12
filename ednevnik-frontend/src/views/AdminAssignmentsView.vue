<template>
  <section class="grid two-column">
    <article class="card">
      <div class="section-header">
        <div>
          <p class="eyebrow">Admin</p>
          <h2>Teacher Assignments</h2>
        </div>

        <button class="secondary-button" type="button" @click="loadAll" :disabled="loading">
          {{ loading ? "Refreshing..." : "Refresh" }}
        </button>
      </div>

      <p v-if="listError" class="error">{{ listError }}</p>

      <table class="table" v-if="assignments.length">
        <thead>
          <tr>
            <th>Teacher</th>
            <th>Class</th>
            <th>Subject</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="assignment in assignments" :key="assignment.id">
            <td>
              <template v-if="editingId === assignment.id">
                <select v-model="edit.teacherId">
                  <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                    {{ teacher.name }}
                  </option>
                </select>
              </template>
              <template v-else>
                {{ assignment.teacher?.name }}
              </template>
            </td>
            <td>
              <template v-if="editingId === assignment.id">
                <select v-model="edit.classId">
                  <option v-for="item in classes" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </option>
                </select>
              </template>
              <template v-else>
                {{ assignment.class?.name }}
              </template>
            </td>
            <td>
              <template v-if="editingId === assignment.id">
                <select v-model="edit.subjectId">
                  <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                    {{ subject.name }}
                  </option>
                </select>
              </template>
              <template v-else>
                {{ assignment.subject?.name }}
              </template>
            </td>
            <td class="actions">
              <template v-if="editingId === assignment.id">
                <button type="button" @click="saveEdit(assignment.id)" :disabled="savingEdit">
                  {{ savingEdit ? "Saving..." : "Save" }}
                </button>
                <button class="secondary-button" type="button" @click="cancelEdit" :disabled="savingEdit">
                  Cancel
                </button>
              </template>
              <template v-else>
                <button type="button" @click="startEdit(assignment)">Edit</button>
                <button
                  class="danger-button"
                  type="button"
                  @click="removeAssignment(assignment)"
                  :disabled="deletingId === assignment.id"
                >
                  {{ deletingId === assignment.id ? "Deleting..." : "Delete" }}
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="muted">No teacher assignments yet.</p>
    </article>

    <article class="card">
      <p class="eyebrow">Create assignment</p>
      <h2>Assign teacher</h2>

      <form class="stack" @submit.prevent="createAssignment">
        <label class="field">
          <span>Teacher</span>
          <select v-model="form.teacherId">
            <option disabled value="">Select teacher</option>
            <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.name }} ({{ teacher.email }})
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

        <label class="field">
          <span>Subject</span>
          <select v-model="form.subjectId">
            <option disabled value="">Select subject</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
        </label>

        <p v-if="formError" class="error">{{ formError }}</p>
        <p v-if="formSuccess" class="success">{{ formSuccess }}</p>

        <button type="submit" :disabled="submitting">
          {{ submitting ? "Saving..." : "Create assignment" }}
        </button>
      </form>
    </article>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";

import { api } from "../lib/api";

const teachers = ref([]);
const classes = ref([]);
const subjects = ref([]);
const assignments = ref([]);
const loading = ref(false);
const listError = ref("");
const formError = ref("");
const formSuccess = ref("");
const submitting = ref(false);
const editingId = ref(null);
const savingEdit = ref(false);
const deletingId = ref(null);

const form = reactive({
  teacherId: "",
  classId: "",
  subjectId: "",
});

const edit = reactive({
  teacherId: "",
  classId: "",
  subjectId: "",
});

onMounted(() => {
  loadAll();
});

async function loadAll() {
  loading.value = true;
  listError.value = "";

  try {
    const [teacherList, classList, subjectList, assignmentList] = await Promise.all([
      api.getUsers("TEACHER"),
      api.getClasses(),
      api.getSubjects(),
      api.getAssignments(),
    ]);

    teachers.value = teacherList;
    classes.value = classList;
    subjects.value = subjectList;
    assignments.value = assignmentList;
  } catch (err) {
    listError.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function createAssignment() {
  submitting.value = true;
  formError.value = "";
  formSuccess.value = "";

  try {
    const created = await api.createAssignment({
      teacherId: Number(form.teacherId),
      classId: Number(form.classId),
      subjectId: Number(form.subjectId),
    });

    form.teacherId = "";
    form.classId = "";
    form.subjectId = "";
    formSuccess.value = `${created.teacher.name} assigned to ${created.class.name} / ${created.subject.name}.`;
    await loadAll();
  } catch (err) {
    formError.value = err.message;
  } finally {
    submitting.value = false;
  }
}

function startEdit(assignment) {
  editingId.value = assignment.id;
  edit.teacherId = assignment.teacher?.id ?? "";
  edit.classId = assignment.class?.id ?? "";
  edit.subjectId = assignment.subject?.id ?? "";
}

function cancelEdit() {
  editingId.value = null;
  edit.teacherId = "";
  edit.classId = "";
  edit.subjectId = "";
}

async function saveEdit(id) {
  savingEdit.value = true;
  listError.value = "";
  formSuccess.value = "";

  try {
    const updated = await api.updateAssignment(id, {
      teacherId: Number(edit.teacherId),
      classId: Number(edit.classId),
      subjectId: Number(edit.subjectId),
    });
    formSuccess.value = `${updated.teacher.name} assigned to ${updated.class.name} / ${updated.subject.name}.`;
    cancelEdit();
    await loadAll();
  } catch (err) {
    listError.value = err.message;
  } finally {
    savingEdit.value = false;
  }
}

async function removeAssignment(assignment) {
  deletingId.value = assignment.id;
  listError.value = "";
  formSuccess.value = "";

  try {
    await api.deleteAssignment(assignment.id);
    formSuccess.value = `${assignment.teacher.name} removed from ${assignment.class.name} / ${assignment.subject.name}.`;
    if (editingId.value === assignment.id) {
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
