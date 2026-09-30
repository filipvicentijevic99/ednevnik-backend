<template>
  <section class="grid">
    <article class="card stack">
      <div class="section-header">
        <div>
          <p class="eyebrow">Teaching</p>
          <h2>Gradebook</h2>
        </div>
        <button class="secondary-button" :disabled="loading || saving" @click="loadAssignments">Refresh</button>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="success" class="success" role="status">{{ success }}</p>
      <label v-if="assignments.length" class="field">
        <span>Class and subject</span>
        <select v-model="selectedId" :disabled="loading || saving" @change="loadBook">
          <option v-for="item in assignments" :key="item.id" :value="item.id">
            {{ item.schoolClass.name }} — {{ item.subject.name }} ({{ item.teacher.name }})
          </option>
        </select>
      </label>
      <p v-if="loading" class="muted" role="status">Loading gradebook...</p>
      <p v-else-if="!assignments.length && !error" class="muted">
        No teaching assignments yet. An administrator needs to assign a teacher to a class and subject first.
      </p>
    </article>

    <template v-if="book && !loading">
      <div class="grid two-column">
        <article class="card stack">
          <h2>{{ book.assignment.schoolClass.name }} · {{ book.assignment.subject.name }}</h2>
          <p class="muted">Current class roster. Averages are informational, not final grades.</p>
          <div v-if="book.students.length" class="table-scroll">
            <table class="table">
              <thead><tr><th>Student</th><th>Grades</th><th>Average</th><th>Action</th></tr></thead>
              <tbody>
                <tr v-for="student in roster" :key="student.id">
                  <td>{{ student.name }}</td>
                  <td>{{ student.values.join(', ') || 'No grades' }}</td>
                  <td>{{ student.average }}</td>
                  <td><button :disabled="saving" @click="newGrade(student.id)">Add grade</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="muted">No students enrolled in this class. Ask an administrator to add enrollments.</p>
        </article>

        <article class="card stack">
          <h2>{{ editingId ? 'Edit grade' : 'Record a grade' }}</h2>
          <form v-if="book.students.length || editingId" class="stack" @submit.prevent="saveGrade">
            <label class="field">
              <span>Student</span>
              <input v-if="editingId" :value="editingStudentName" disabled />
              <select v-else v-model="form.studentId" required :disabled="saving">
                <option disabled value="">Choose a student</option>
                <option v-for="student in book.students" :key="student.id" :value="student.id">{{ student.name }}</option>
              </select>
            </label>
            <label class="field">
              <span>Grade (1–5)</span>
              <select v-model.number="form.value" :disabled="saving">
                <option v-for="value in 5" :key="value" :value="value">{{ value }}</option>
              </select>
            </label>
            <label class="field"><span>Date</span><input v-model="form.gradedOn" type="date" required :disabled="saving" /></label>
            <label class="field"><span>Note (optional)</span><input v-model="form.note" maxlength="500" placeholder="For example: written assessment" :disabled="saving" /></label>
            <div class="actions">
              <button :disabled="saving">{{ saving ? 'Saving...' : editingId ? 'Save changes' : 'Record grade' }}</button>
              <button v-if="editingId" type="button" class="secondary-button" :disabled="saving" @click="newGrade()">Cancel edit</button>
            </div>
          </form>
          <p v-else class="muted">Enroll students before recording grades.</p>
        </article>
      </div>

      <article class="card stack">
        <h2>Recorded grades</h2>
        <p class="muted">Includes past students who have moved to another class. Original author is preserved when a grade is edited.</p>
        <div v-if="book.grades.length" class="table-scroll">
          <table class="table">
            <thead><tr><th>Student</th><th>Grade</th><th>Date</th><th>Note</th><th>Recorded by</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="grade in book.grades" :key="grade.id">
                <td>{{ grade.student.name }}</td><td><strong>{{ grade.value }}</strong></td>
                <td>{{ grade.gradedOn.slice(0, 10) }}</td><td>{{ grade.note || '—' }}</td><td>{{ grade.author.name }}</td>
                <td><div class="actions">
                  <button class="secondary-button" :disabled="saving" @click="editGrade(grade)">Edit</button>
                  <button class="danger-button" :disabled="saving" @click="removeGrade(grade)">Delete</button>
                </div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="muted">No grades recorded yet.</p>
      </article>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { api } from "../lib/api";

const assignments = ref([]);
const selectedId = ref(null);
const book = ref(null);
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const editingId = ref(null);
const editingStudentName = ref("");
const form = reactive({ studentId: "", value: 5, gradedOn: today(), note: "" });

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const roster = computed(() => (book.value?.students || []).map((student) => {
  const values = book.value.grades.filter((grade) => grade.studentId === student.id).map((grade) => grade.value);
  return { ...student, values, average: values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2) : '—' };
}));

function newGrade(studentId = "") {
  editingId.value = null;
  editingStudentName.value = "";
  Object.assign(form, { studentId, value: 5, gradedOn: today(), note: "" });
}

function editGrade(grade) {
  editingId.value = grade.id;
  editingStudentName.value = grade.student.name;
  Object.assign(form, { studentId: grade.studentId, value: grade.value, gradedOn: grade.gradedOn.slice(0, 10), note: grade.note });
  success.value = "";
}

async function loadAssignments() {
  loading.value = true;
  error.value = "";
  success.value = "";
  book.value = null;
  try {
    assignments.value = await api.getGradebookAssignments();
    if (!assignments.value.some((item) => item.id === selectedId.value)) selectedId.value = assignments.value[0]?.id || null;
    if (selectedId.value) book.value = await api.getGradebook(selectedId.value);
    newGrade();
  } catch (err) {
    error.value = err.message;
  } finally { loading.value = false; }
}

async function loadBook() {
  loading.value = true;
  error.value = "";
  success.value = "";
  book.value = null;
  newGrade();
  try { book.value = await api.getGradebook(selectedId.value); }
  catch (err) { error.value = err.message; }
  finally { loading.value = false; }
}

async function refreshAfterWrite() {
  try { book.value = await api.getGradebook(selectedId.value); }
  catch {
    book.value = null;
    error.value = "Your change was saved, but the gradebook could not reload. Click Refresh.";
  }
}

async function saveGrade() {
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    const data = { value: form.value, gradedOn: form.gradedOn, note: form.note };
    if (editingId.value) await api.updateGrade(selectedId.value, editingId.value, data);
    else await api.createGrade(selectedId.value, { ...data, studentId: form.studentId });
    newGrade();
    success.value = "Grade saved.";
    await refreshAfterWrite();
  } catch (err) { error.value = err.message; }
  finally { saving.value = false; }
}

async function removeGrade(grade) {
  if (!window.confirm(`Delete grade ${grade.value} for ${grade.student.name}? This cannot be undone.`)) return;
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    await api.deleteGrade(selectedId.value, grade.id);
    if (editingId.value === grade.id) newGrade();
    success.value = "Grade deleted.";
    await refreshAfterWrite();
  } catch (err) { error.value = err.message; }
  finally { saving.value = false; }
}

onMounted(loadAssignments);
</script>
