<template>
  <AdminCatalogView
    title="Classes"
    singular-label="Class"
    plural-label="Classes"
    :load="api.getClasses"
    :create="api.createClass"
    :update="api.updateClass"
    :remove="api.deleteClass"
  />
</template>

<script setup>
import { api } from "../lib/api";
import AdminCatalogView from "./AdminCatalogView.vue";
</script>
