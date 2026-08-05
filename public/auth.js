window.MADOLOGY_API_BASE_URL =
  window.MADOLOGY_API_BASE_URL ||
  localStorage.getItem("apiBaseUrl") ||
  "http://localhost:3000";

function parseJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch (error) {
    return null;
  }
}

function bootstrapAuthFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");

  if (!tokenFromUrl) {
    return;
  }

  const payload = parseJwtPayload(tokenFromUrl);

  if (!payload || payload.type !== "auth") {
    return;
  }

  localStorage.setItem("token", tokenFromUrl);

  if (payload.name) {
    localStorage.setItem("userName", payload.name);
  }

  if (payload.role) {
    localStorage.setItem("userRole", payload.role);
  }

  params.delete("token");
  const newQuery = params.toString();
  const cleanUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ""}${window.location.hash}`;
  window.history.replaceState({}, document.title, cleanUrl);
}

bootstrapAuthFromUrl();

function getAuthToken() {
  return localStorage.getItem("token");
}

function getUserName() {
  return localStorage.getItem("userName");
}

function getUserRole() {
  return localStorage.getItem("userRole");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  window.location.href = "index.html";
}

function isLoggedIn() {
  return Boolean(getAuthToken());
}

window.MADOLOGY_AUTH = {
  apiBaseUrl: window.MADOLOGY_API_BASE_URL,
  parseJwtPayload,
  bootstrapAuthFromUrl,
  getAuthToken,
  getUserName,
  getUserRole,
  logout,
  isLoggedIn
};
