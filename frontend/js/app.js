(() => {
  const metaApiBase = document.querySelector('meta[name="back2you-api-base"]')?.content?.trim();
  const runtimeApiBase = window.BACK2YOU_API_BASE_URL;
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const API_BASE_URL = runtimeApiBase || metaApiBase || (isLocalHost ? "http://localhost:5000/api" : "/api");
  const TOKEN_KEY = "back2youAuthToken";
  const USER_KEY = "back2youAuthUser";

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getCurrentUser() {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  }

  function setSession(user) {
    localStorage.setItem(TOKEN_KEY, user.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem("back2youUserName", user.name);
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("back2youUserName");
  }

  async function request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getToken();
    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

    if (!isFormData) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  function requireAuth(redirectTo = "login.html") {
    if (!getToken()) {
      window.location.href = redirectTo;
      return false;
    }

    return true;
  }

  window.Back2YouAPI = {
    API_BASE_URL,
    getToken,
    getCurrentUser,
    setSession,
    clearSession,
    request,
    requireAuth
  };
})();
