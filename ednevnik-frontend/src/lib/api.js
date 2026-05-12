import { clearStoredAuth, notifyUnauthorized, readStoredToken } from "./auth-storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const token = readStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredAuth();
    notifyUnauthorized();
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload.message || "Request failed.";

    throw new Error(message);
  }

  return payload;
}

export const api = {
  login(credentials) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  getMe() {
    return request("/me");
  },
  getUsers(role) {
    const query = role ? `?role=${encodeURIComponent(role)}` : "";
    return request(`/admin/users${query}`);
  },
  createUser(data) {
    return request("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  getClasses() {
    return request("/admin/classes");
  },
  createClass(data) {
    return request("/admin/classes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateClass(id, data) {
    return request(`/admin/classes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteClass(id) {
    return request(`/admin/classes/${id}`, {
      method: "DELETE",
    });
  },
  getSubjects() {
    return request("/admin/subjects");
  },
  createSubject(data) {
    return request("/admin/subjects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateSubject(id, data) {
    return request(`/admin/subjects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  deleteSubject(id) {
    return request(`/admin/subjects/${id}`, {
      method: "DELETE",
    });
  },
};
