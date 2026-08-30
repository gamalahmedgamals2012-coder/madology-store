const API_BASE_URL =
  window.MADOLOGY_API_BASE_URL || localStorage.getItem("apiBaseUrl") || "";

const params = new URLSearchParams(window.location.search);
const email = (params.get("email") || "").trim();

const emailText = document.getElementById("emailText");
const verificationCodeInput = document.getElementById("verificationCode");
const verifyBtn = document.getElementById("verifyBtn");
const resendBtn = document.getElementById("resendBtn");
const statusMessage = document.getElementById("statusMessage");

function setStatus(message, isError = false) {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

emailText.textContent = email || "your email";

verificationCodeInput.addEventListener("input", () => {
  verificationCodeInput.value = verificationCodeInput.value
    .replace(/\D/g, "")
    .slice(0, 6);
});

resendBtn.onclick = async () => {
  if (!email) {
    setStatus("Missing email address. Please register again.", true);
    return;
  }

  resendBtn.disabled = true;
  resendBtn.innerText = "Sending...";
  setStatus("Sending a new verification code...");

  try {
    const res = await fetch(`${API_BASE_URL}/auth/resend-verification-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await res.json();

    if (!res.ok) {
      setStatus(result.message || "Unable to resend code.", true);
      return;
    }

    setStatus(result.message || "A new verification code has been sent.");
  } catch (error) {
    console.error(error);
    setStatus("Server error. Try again later.", true);
  } finally {
    resendBtn.disabled = false;
    resendBtn.innerText = "Resend Code";
  }
};

verifyBtn.onclick = async () => {
  const code = verificationCodeInput.value.trim();

  if (!email) {
    window.MADOLOGY_SHOW_TOAST?.(
      "Missing email address. Please register again.",
      "error",
    );
    return;
  }

  if (code.length !== 6) {
    window.MADOLOGY_SHOW_TOAST?.("Please enter the 6-digit code.", "error");
    return;
  }

  verifyBtn.disabled = true;
  verifyBtn.innerText = "Verifying...";

  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const result = await res.json();

    if (!res.ok) {
      window.MADOLOGY_SHOW_TOAST?.(
        result.message || "Verification failed.",
        "error",
      );
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
  } catch (error) {
    console.error(error);
    window.MADOLOGY_SHOW_TOAST?.("Server error. Try again later.", "error");
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.innerText = "Verify Code";
  }
};
