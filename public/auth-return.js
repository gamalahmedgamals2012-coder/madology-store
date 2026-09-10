(function configureAuthReturnNavigation() {
  function getSafeReturnUrl(value) {
    if (!value || typeof value !== "string") return "";
    const candidate = value.trim();
    if (!candidate || candidate.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(candidate)) return "";
    try {
      const url = new URL(candidate, window.location.origin);
      if (url.origin !== window.location.origin || url.pathname.endsWith("/register.html")) return "";
      return `${url.pathname.replace(/^\//, "")}${url.search}${url.hash}` || "index.html";
    } catch (error) {
      return "";
    }
  }

  function getRegisterUrl() {
    const current = `${window.location.pathname.replace(/^\//, "")}${window.location.search}${window.location.hash}`;
    return `register.html?returnUrl=${encodeURIComponent(getSafeReturnUrl(current) || "index.html")}`;
  }

  window.MADOLOGY_AUTH_RETURN = { getSafeReturnUrl, getRegisterUrl };
})();
