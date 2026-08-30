(() => {
  function normalizeBaseUrl(value) {
    if (typeof value !== "string") {
      return "";
    }

    const trimmed = value.trim().replace(/\/$/, "");

    if (!trimmed) {
      return "";
    }

    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) {
      return "";
    }

    return trimmed;
  }

  function resolveApiBaseUrl() {
    return (
      normalizeBaseUrl(window.MADOLOGY_API_BASE_URL) ||
      normalizeBaseUrl(localStorage.getItem("apiBaseUrl")) ||
      ""
    );
  }

  window.MADOLOGY_GET_API_BASE_URL = resolveApiBaseUrl;
  window.MADOLOGY_API_BASE_URL = resolveApiBaseUrl();
})();
