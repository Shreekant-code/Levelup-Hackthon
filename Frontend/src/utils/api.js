const BASE_URL = "http://localhost:3000";

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const redirectToLogin = () => {
  localStorage.removeItem("token");
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await safeJson(response);

    if (response.status === 401) {
      redirectToLogin();
      return { ok: false, status: 401, data: { message: data?.message || "Unauthorized" } };
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data: { message: data?.message || "Request failed" },
      };
    }

    return { ok: true, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: "Network error. Please try again." },
    };
  }
};

export const api = {
  get: (path) => apiRequest(path, { method: "GET" }),
  post: (path, body) =>
    apiRequest(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: (path, body) =>
    apiRequest(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (path) => apiRequest(path, { method: "DELETE" }),
};
