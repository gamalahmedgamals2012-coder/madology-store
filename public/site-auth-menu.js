(function initSiteAuthMenu() {
  const authButton = document.querySelector(".register");

  if (!authButton) {
    return;
  }

  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");

  if (!token || !userName) {
    authButton.href = "register.html";
    authButton.innerHTML = '<i class="fa-solid fa-user-plus"></i>';
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
        <button class="dropdown-logout-btn" id="logoutBtn" type="button">
          Logout
        </button>
      </div>
    </div>
  `;

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
