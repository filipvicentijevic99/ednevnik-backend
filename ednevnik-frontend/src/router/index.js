import { createRouter, createWebHistory } from "vue-router";

import { useAuthStore } from "../stores/auth";
import AdminClassesView from "../views/AdminClassesView.vue";
import AdminSubjectsView from "../views/AdminSubjectsView.vue";
import AdminUsersView from "../views/AdminUsersView.vue";
import DashboardView from "../views/DashboardView.vue";
import LoginView from "../views/LoginView.vue";

const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin/users",
    name: "admin-users",
    component: AdminUsersView,
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
  {
    path: "/admin/classes",
    name: "admin-classes",
    component: AdminClassesView,
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
  {
    path: "/admin/subjects",
    name: "admin-subjects",
    component: AdminSubjectsView,
    meta: { requiresAuth: true, roles: ["ADMIN"] },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  auth.hydrate();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login" };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: "dashboard" };
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return { name: "dashboard" };
  }

  return true;
});

export { router };
