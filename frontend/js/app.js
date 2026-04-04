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

    const primaryUrl = `${API_BASE_URL}${path}`;
    const fallbackBaseUrl = API_BASE_URL.replace("localhost", "127.0.0.1");
    const fallbackUrl = fallbackBaseUrl === API_BASE_URL ? null : `${fallbackBaseUrl}${path}`;
    let response;

    try {
      response = await fetch(primaryUrl, {
        ...options,
        headers
      });
    } catch (error) {
      if (fallbackUrl) {
        try {
          response = await fetch(fallbackUrl, {
            ...options,
            headers
          });
        } catch (fallbackError) {
          throw new Error(`Unable to reach the server at ${API_BASE_URL}. Start the backend with: cd /d "d:\\lost and found\\backend" && npm.cmd start`);
        }
      } else {
        throw new Error(`Unable to reach the server at ${API_BASE_URL}. Start the backend with: cd /d "d:\\lost and found\\backend" && npm.cmd start`);
      }
    }

    const rawBody = await response.text();
    let data = {};

    if (rawBody) {
      try {
        data = JSON.parse(rawBody);
      } catch (error) {
        data = { message: rawBody };
      }
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
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
