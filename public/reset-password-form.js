(function () {
  const form = document.getElementById("resetForm");
  const message = document.getElementById("message");

  if (!form || !message) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const response = await fetch(window.location.pathname, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    const data = await response.json();
    message.textContent = data.message;

    if (response.ok) {
      form.reset();
    }
  });
})();
