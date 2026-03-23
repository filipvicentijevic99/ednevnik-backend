const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const token = localStorage.getItem("ednevnik_token");
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
    localStorage.removeItem("ednevnik_token");
    localStorage.removeItem("ednevnik_user");
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
};
