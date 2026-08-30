const API_BASE_URL =
  window.MADOLOGY_GET_API_BASE_URL?.() || window.MADOLOGY_API_BASE_URL || "";

const emailInput = document.getElementById("email");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const selectedAddressInput = document.getElementById("address");
const selectedLatitudeInput = document.getElementById("latitude");
const selectedLongitudeInput = document.getElementById("longitude");
const addressStatus = document.getElementById("addressStatus");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");

function isValidMapSelection() {
  return (
    selectedAddressInput.dataset.locationSelected === "true" &&
    selectedLatitudeInput.value !== "" &&
    selectedLongitudeInput.value !== ""
  );
}

function getSelectedLocation() {
  return window.MADOLOGY_SELECTED_LOCATION || null;
}

registerBtn.onclick = async () => {
  if (
    !emailInput.value ||
    !nameInput.value ||
    !phoneInput.value ||
    !selectedAddressInput.value ||
    !passwordInput.value
  ) {
    window.MADOLOGY_SHOW_TOAST?.("Please fill all fields.", "error");
    return;
  }

  if (!isValidMapSelection()) {
    window.MADOLOGY_SHOW_TOAST?.(
      "Please select your address from the map first.",
      "error",
    );
    return;
  }

  registerBtn.disabled = true;
  registerBtn.innerText = "Registering...";

  const data = {
    email: emailInput.value.trim(),
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    address: selectedAddressInput.value.trim(),
    latitude: Number(selectedLatitudeInput.value),
    longitude: Number(selectedLongitudeInput.value),
    addressDetails: getSelectedLocation()?.addressDetails,
    password: passwordInput.value,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      window.MADOLOGY_SHOW_TOAST?.(
        result.message || "Registration failed.",
        "error",
      );
      return;
    }

    window.MADOLOGY_SHOW_TOAST?.(
      result.message || "Registration successful.",
      "success",
    );

    window.location.href = `verify-email.html?email=${encodeURIComponent(data.email)}`;
  } catch (err) {
    console.error(err);
    window.MADOLOGY_SHOW_TOAST?.("Server error. Try again later.", "error");
  } finally {
    registerBtn.disabled = false;
    registerBtn.innerText = "Register";
  }
};

window.MADOLOGY_SET_ADDRESS_STATUS = (message) => {
  if (addressStatus) {
    addressStatus.textContent = message || "";
  }
};
