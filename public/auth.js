window.MADOLOGY_API_BASE_URL =
  window.MADOLOGY_GET_API_BASE_URL?.() || window.MADOLOGY_API_BASE_URL || "";

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

function setAuthSession(token, user = {}) {
  if (!token) return false;
  localStorage.setItem("token", token);
  const payload = parseJwtPayload(token) || {};
  localStorage.setItem("userName", user.name || user.username || payload.name || payload.username || "");
  localStorage.setItem("userRole", user.role || payload.role || "user");
  if (user.phone !== undefined) localStorage.setItem("userPhone", user.phone || "");
  if (user.address !== undefined) localStorage.setItem("userAddress", user.address || "");
  if (user.latitude !== undefined) localStorage.setItem("userLatitude", user.latitude ?? "");
  if (user.longitude !== undefined) localStorage.setItem("userLongitude", user.longitude ?? "");
  return true;
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
  const token = getAuthToken();
  const payload = token && parseJwtPayload(token);
  return Boolean(token && payload && (!payload.exp || payload.exp * 1000 > Date.now()));
}

window.MADOLOGY_AUTH = {
  apiBaseUrl: window.MADOLOGY_API_BASE_URL,
  parseJwtPayload,
  bootstrapAuthFromUrl,
  setAuthSession,
  getAuthToken,
  getUserName,
  getUserRole,
  logout,
  isLoggedIn,
};
