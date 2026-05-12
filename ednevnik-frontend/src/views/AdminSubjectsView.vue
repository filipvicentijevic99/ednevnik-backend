<template>
  <AdminCatalogView
    title="Subjects"
    singular-label="Subject"
    plural-label="Subjects"
    :load="api.getSubjects"
    :create="api.createSubject"
    :update="api.updateSubject"
    :remove="api.deleteSubject"
  />
</template>

<script setup>
import { api } from "../lib/api";
import AdminCatalogView from "./AdminCatalogView.vue";
</script>
