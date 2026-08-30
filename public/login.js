const API_BASE_URL =
  window.MADOLOGY_GET_API_BASE_URL?.() || window.MADOLOGY_API_BASE_URL || "";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
function showVerificationMessage() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("verified") === "1") {
    window.MADOLOGY_SHOW_TOAST?.(
      "Your email has been verified. You can log in now.",
      "success",
    );
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
loginBtn.onclick = async () => {
  loginBtn.disabled = true;

  const data = {
    email: emailInput.value.trim(),
    password: passwordInput.value,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      window.MADOLOGY_SHOW_TOAST?.(
        result.message || "Login failed. Please try again.",
        "error",
      );
      loginBtn.disabled = false;
      return;
    }

    localStorage.setItem("token", result.token);
    localStorage.setItem("userName", result.user.name);
    localStorage.setItem("userRole", result.user.role);
    localStorage.setItem("userPhone", result.user.phone || "");
    localStorage.setItem("userAddress", result.user.address || "");
    localStorage.setItem("userLatitude", result.user.latitude ?? "");
    localStorage.setItem("userLongitude", result.user.longitude ?? "");

    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    window.MADOLOGY_SHOW_TOAST?.("Server error. Try again later.", "error");
  } finally {
    loginBtn.disabled = false;
  }
};
showVerificationMessage();
