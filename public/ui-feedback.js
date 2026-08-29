(function () {
  const container = document.getElementById("uiToastContainer");

  if (!container) {
    return;
  }

  function removeToast(toast) {
    if (!toast || !toast.isConnected) {
      return;
    }

    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 220);
  }

  function showToast(message, type = "info", timeout = 3600) {
    if (!message) {
      return null;
    }

    const toast = document.createElement("div");
    toast.className = `ui-toast ui-toast-${type}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");

    const text = document.createElement("span");
    text.className = "ui-toast-message";
    text.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "ui-toast-close";
    closeButton.setAttribute("aria-label", "Dismiss notification");
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => removeToast(toast));

    toast.appendChild(text);
    toast.appendChild(closeButton);
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    const timer = window.setTimeout(() => removeToast(toast), timeout);
    toast.dataset.timer = String(timer);

    return toast;
  }

  window.MADOLOGY_SHOW_TOAST = showToast;
  window.MADOLOGY_REMOVE_TOAST = removeToast;
})();
