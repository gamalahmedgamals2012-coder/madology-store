const API_BASE_URL =
  window.MADOLOGY_GET_API_BASE_URL?.() || window.MADOLOGY_API_BASE_URL || "";

const usernameInput = document.getElementById("username");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const selectedAddressInput = document.getElementById("address");
const selectedLatitudeInput = document.getElementById("latitude");
const selectedLongitudeInput = document.getElementById("longitude");
const addressStatus = document.getElementById("addressStatus");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const t = (key, variables) => window.MADOLOGY_I18N?.t(key, variables) || key;

function isValidMapSelection() {
  const latitude = Number(selectedLatitudeInput.value);
  const longitude = Number(selectedLongitudeInput.value);

  return (
    selectedAddressInput.dataset.locationSelected === "true" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function getSelectedLocation() {
  return window.MADOLOGY_SELECTED_LOCATION || null;
}

registerBtn.onclick = async () => {
  if (
    !usernameInput.value ||
    !nameInput.value ||
    !phoneInput.value ||
    !selectedAddressInput.value ||
    !passwordInput.value
  ) {
    window.MADOLOGY_SHOW_TOAST?.(t("Please fill all fields."), "error");
    return;
  }

  if (!isValidMapSelection()) {
    const hasCoordinates =
      selectedLatitudeInput.value.trim() !== "" &&
      selectedLongitudeInput.value.trim() !== "" &&
      Number.isFinite(Number(selectedLatitudeInput.value)) &&
      Number.isFinite(Number(selectedLongitudeInput.value));

    window.MADOLOGY_SHOW_TOAST?.(
      hasCoordinates
        ? t("Please wait for the address to load after selecting the map location.")
        : t("Please select your location on the map first."),
      "error",
    );
    return;
  }

  registerBtn.disabled = true;
  registerBtn.innerText = t("Registering...");

  const data = {
    username: usernameInput.value.trim(),
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    address: selectedAddressInput.value.trim(),
    latitude: Number(selectedLatitudeInput.value),
    longitude: Number(selectedLongitudeInput.value),
    addressDetails: getSelectedLocation()?.addressDetails,
    password: passwordInput.value,
  };

  if (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
    window.MADOLOGY_SHOW_TOAST?.(
      t("Please select your location on the map first."),
      "error",
    );
    registerBtn.disabled = false;
    registerBtn.innerText = "Register";
    return;
  }

  if (
    data.latitude < -90 ||
    data.latitude > 90 ||
    data.longitude < -180 ||
    data.longitude > 180
  ) {
    window.MADOLOGY_SHOW_TOAST?.(
      t("Selected coordinates are invalid. Please choose a different map location."),
      "error",
    );
    registerBtn.disabled = false;
    registerBtn.innerText = "Register";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      window.MADOLOGY_SHOW_TOAST?.(
      result.message || t("Registration failed."),
        "error",
      );
      return;
    }

    window.MADOLOGY_SHOW_TOAST?.(
      result.message || t("Registration successful."),
      "success",
    );

    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    window.MADOLOGY_SHOW_TOAST?.(t("Server error. Try again later."), "error");
  } finally {
    registerBtn.disabled = false;
    registerBtn.innerText = t("Register");
  }
};

window.MADOLOGY_SET_ADDRESS_STATUS = (message) => {
  if (addressStatus) {
    addressStatus.textContent = message || "";
  }
};
