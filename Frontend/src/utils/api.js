const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://levelup-hackthon-1.onrender.com");

const safeJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return { __nonJson: true };
  }

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
  if (!BASE_URL) {
    return {
      ok: false,
      status: 0,
      data: {
        message:
          "API base URL is not configured. Set VITE_API_URL in frontend environment variables.",
      },
    };
  }

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

    if (data?.__nonJson) {
      return {
        ok: false,
        status: response.status,
        data: {
          message:
            "API returned non-JSON response. Verify VITE_API_URL points to backend service.",
        },
      };
    }

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
