(function initSiteAuthMenu() {
  const authButton = document.querySelector(".register");

  if (!authButton) {
    return;
  }

  const themeStorageKey = "mado-theme";

  function getPreferredTheme() {
    const storedTheme = localStorage.getItem(themeStorageKey);

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(themeStorageKey, theme);

    const themeButton = document.querySelector(".theme-toggle");
    const themeIcon = themeButton?.querySelector("i");
    const themeLabel = themeButton?.querySelector(".theme-toggle-label");

    if (themeIcon) {
      themeIcon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }

    if (themeLabel) {
      themeLabel.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    }

    if (themeButton) {
      themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      themeButton.setAttribute("aria-pressed", String(theme === "dark"));
    }
  }

  function createThemeToggle() {
    const themeButton = document.createElement("button");
    themeButton.type = "button";
    themeButton.className = "theme-toggle";
    themeButton.setAttribute("aria-label", "Switch to dark mode");
    themeButton.setAttribute("aria-pressed", "false");
    themeButton.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i><span class="visually-hidden theme-toggle-label">Dark mode</span>';

    themeButton.addEventListener("click", () => {
      const nextTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
    });

    return themeButton;
  }

  applyTheme(getPreferredTheme());
  const themeToggle = createThemeToggle();

  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");

  if (!token || !userName) {
    authButton.href = "register.html";
    authButton.innerHTML = '<i class="fa-solid fa-user-plus"></i>';
    authButton.insertAdjacentElement("afterend", themeToggle);
    return;
  }

  authButton.outerHTML = `
    <div class="profile-container">
      <button class="profile-button" id="profileBtn" type="button" aria-label="Open account menu">
        <i class="fa-solid fa-circle-user"></i>
      </button>
      <div class="dropdown-menu" id="dropdownMenu">
        <div class="dropdown-header">
          <div>${userName}</div>
          <div class="dropdown-user-name">User Account</div>
        </div>
        <a class="dropdown-link" href="account.html#profile">
          Account
        </a>
        <a class="dropdown-link" href="account.html#wishlist">
          Wishlist
        </a>
        <a class="dropdown-link" href="account.html#orders">
          Orders
        </a>
        <button class="dropdown-logout-btn" id="logoutBtn" type="button">
          Logout
        </button>
      </div>
    </div>
  `;

  const profileContainer = document.querySelector(".profile-container");
  profileContainer?.insertAdjacentElement("afterend", themeToggle);

  const profileButton = document.getElementById("profileBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const logoutButton = document.getElementById("logoutBtn");

  profileButton.addEventListener("click", () => {
    dropdownMenu.classList.toggle("show");
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".profile-container")) {
      dropdownMenu.classList.remove("show");
    }
  });

  logoutButton.addEventListener("click", () => {
    if (!confirm("Do you really want to logout?")) {
      return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");

    if (window.MADOLOGY_CART) {
      window.MADOLOGY_CART.clearCart();
    }

    location.reload();
  });
})();
