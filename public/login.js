const API_BASE_URL =
  window.MADOLOGY_GET_API_BASE_URL?.() || window.MADOLOGY_API_BASE_URL || "";

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const registerLink = document.querySelector(".account-signup a");
const t = (key, variables) => window.MADOLOGY_I18N?.t(key, variables) || key;

if (registerLink) {
  registerLink.href = window.MADOLOGY_AUTH_RETURN?.getRegisterUrl() || "register.html";
}
loginBtn.onclick = async () => {
  loginBtn.disabled = true;

  const data = {
    username: usernameInput.value.trim(),
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
        result.message || t("Login failed. Please try again."),
        "error",
      );
      loginBtn.disabled = false;
      return;
    }

    if (window.MADOLOGY_AUTH?.setAuthSession) {
      window.MADOLOGY_AUTH.setAuthSession(result.token, result.user);
    } else {
      localStorage.setItem("token", result.token);
      localStorage.setItem("userName", result.user.name || result.user.username || "");
    }

    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
    window.MADOLOGY_SHOW_TOAST?.(t("Server error. Try again later."), "error");
  } finally {
    loginBtn.disabled = false;
  }
};
