const API_BASE_URL =
  window.MADOLOGY_API_BASE_URL ||
  localStorage.getItem("apiBaseUrl") ||
  "http://localhost:3000";

const emailInput = document.getElementById("email");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const addressInput = document.getElementById("address");
const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");
const passwordInput = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");

function isValidMapSelection() {
  return addressInput.dataset.locationSelected === "true" && latitudeInput.value && longitudeInput.value;
}

registerBtn.onclick = async () => {
  if (
    !emailInput.value ||
    !nameInput.value ||
    !phoneInput.value ||
    !addressInput.value ||
    !passwordInput.value
  ) {
    alert("Please fill all fields");
    return;
  }

  if (!isValidMapSelection()) {
    alert("Please select your address from Google Maps first");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.innerText = "Registering...";

  const data = {
    email: emailInput.value.trim(),
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    address: addressInput.value.trim(),
    latitude: Number(latitudeInput.value),
    longitude: Number(longitudeInput.value),
    password: passwordInput.value
  };

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message);
      return;
    }

    alert(result.message);

    window.location.href = `verify-email.html?email=${encodeURIComponent(data.email)}`;
  } catch (err) {
    console.error(err);
    alert("Server error. Try again later.");
  } finally {
    registerBtn.disabled = false;
    registerBtn.innerText = "Register";
  }
};
