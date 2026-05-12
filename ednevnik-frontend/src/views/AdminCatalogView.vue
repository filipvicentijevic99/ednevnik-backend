<template>
  <section class="grid two-column">
    <article class="card">
      <div class="section-header">
        <div>
          <p class="eyebrow">Admin</p>
          <h2>{{ title }}</h2>
        </div>

        <button class="secondary-button" type="button" @click="loadItems" :disabled="loadingList">
          {{ loadingList ? "Refreshing..." : "Refresh" }}
        </button>
      </div>

      <p v-if="listError" class="error">{{ listError }}</p>

      <table class="table" v-if="items.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.id }}</td>
            <td>
              <template v-if="editingId === item.id">
                <input v-model="editingName" />
              </template>
              <template v-else>
                {{ item.name }}
              </template>
            </td>
            <td>{{ formatDate(item.createdAt) }}</td>
            <td class="actions">
              <template v-if="editingId === item.id">
                <button type="button" @click="saveEdit(item.id)" :disabled="savingEdit">
                  {{ savingEdit ? "Saving..." : "Save" }}
                </button>
                <button class="secondary-button" type="button" @click="cancelEdit" :disabled="savingEdit">
                  Cancel
                </button>
              </template>
              <template v-else>
                <button type="button" @click="startEdit(item)">Edit</button>
                <button
                  class="danger-button"
                  type="button"
                  @click="removeItem(item)"
                  :disabled="deletingId === item.id"
                >
                  {{ deletingId === item.id ? "Deleting..." : "Delete" }}
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>

      <p v-else class="muted">No {{ pluralLabel.toLowerCase() }} yet.</p>
    </article>

    <article class="card">
      <p class="eyebrow">Create {{ singularLabel }}</p>
      <h2>New {{ singularLabel.toLowerCase() }}</h2>

      <form class="stack" @submit.prevent="createItem">
        <label class="field">
          <span>Name</span>
          <input v-model="form.name" required />
        </label>

        <p v-if="formError" class="error">{{ formError }}</p>
        <p v-if="formSuccess" class="success">{{ formSuccess }}</p>

        <button type="submit" :disabled="submitting">
          {{ submitting ? "Creating..." : `Create ${singularLabel.toLowerCase()}` }}
        </button>
      </form>
    </article>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  singularLabel: {
    type: String,
    required: true,
  },
  pluralLabel: {
    type: String,
    required: true,
  },
  load: {
    type: Function,
    required: true,
  },
  create: {
    type: Function,
    required: true,
  },
  update: {
    type: Function,
    required: true,
  },
  remove: {
    type: Function,
    required: true,
  },
});

const items = ref([]);
const loadingList = ref(false);
const listError = ref("");
const formError = ref("");
const formSuccess = ref("");
const submitting = ref(false);
const editingId = ref(null);
const editingName = ref("");
const savingEdit = ref(false);
const deletingId = ref(null);

const form = reactive({
  name: "",
});

onMounted(() => {
  loadItems();
});

async function loadItems() {
  loadingList.value = true;
  listError.value = "";

  try {
    items.value = await props.load();
  } catch (err) {
    listError.value = err.message;
  } finally {
    loadingList.value = false;
  }
}

async function createItem() {
  submitting.value = true;
  formError.value = "";
  formSuccess.value = "";

  try {
    const created = await props.create({ name: form.name });
    form.name = "";
    formSuccess.value = `${props.singularLabel} "${created.name}" created.`;
    await loadItems();
  } catch (err) {
    formError.value = err.message;
  } finally {
    submitting.value = false;
  }
}

function startEdit(item) {
  editingId.value = item.id;
  editingName.value = item.name;
  formSuccess.value = "";
  listError.value = "";
}

function cancelEdit() {
  editingId.value = null;
  editingName.value = "";
}

async function saveEdit(id) {
  savingEdit.value = true;
  listError.value = "";
  formSuccess.value = "";

  try {
    await props.update(id, { name: editingName.value });
    formSuccess.value = `${props.singularLabel} updated.`;
    cancelEdit();
    await loadItems();
  } catch (err) {
    listError.value = err.message;
  } finally {
    savingEdit.value = false;
  }
}

async function removeItem(item) {
  deletingId.value = item.id;
  listError.value = "";
  formSuccess.value = "";

  try {
    await props.remove(item.id);
    if (editingId.value === item.id) {
      cancelEdit();
    }
    formSuccess.value = `${props.singularLabel} "${item.name}" deleted.`;
    await loadItems();
  } catch (err) {
    listError.value = err.message;
  } finally {
    deletingId.value = null;
  }
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}
</script>
