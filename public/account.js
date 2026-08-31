const API_BASE_URL =
  window.MADOLOGY_GET_API_BASE_URL?.() || window.MADOLOGY_API_BASE_URL || "";

const state = {
  user: null,
  wishlist: [],
  addresses: [],
  orders: [],
};

const panels = Array.from(document.querySelectorAll(".account-panel"));
const tabs = Array.from(document.querySelectorAll(".account-tab"));

function getToken() {
  return localStorage.getItem("token") || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("en-US")} L.E`;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function showToast(message, type = "info") {
  if (window.MADOLOGY_SHOW_TOAST) {
    window.MADOLOGY_SHOW_TOAST(message, type);
  }
}

async function authFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    window.location.href = "login.html";
    throw new Error(data.message || "Authentication is required.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

async function fetchTrustedProductById(productId) {
  if (!productId) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productId)}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return null;
  }

  return data.product || null;
}

function setActivePanel(panelId) {
  panels.forEach((panel) =>
    panel.classList.toggle("active", panel.id === panelId),
  );
  tabs.forEach((tab) =>
    tab.classList.toggle("active", tab.dataset.panel === panelId),
  );

  const hashByPanel = {
    profilePanel: "profile",
    passwordPanel: "password",
    wishlistPanel: "wishlist",
    addressesPanel: "addresses",
    ordersPanel: "orders",
  };

  window.history.replaceState(
    {},
    document.title,
    `#${hashByPanel[panelId] || "profile"}`,
  );
}

function panelFromHash() {
  const hash = window.location.hash.replace("#", "");
  const panelByHash = {
    profile: "profilePanel",
    password: "passwordPanel",
    wishlist: "wishlistPanel",
    addresses: "addressesPanel",
    orders: "ordersPanel",
  };

  return panelByHash[hash] || "profilePanel";
}

function renderUser() {
  const user = state.user || {};

  document.getElementById("accountName").textContent = user.name || "MADOLOGY";
  document.getElementById("accountEmail").textContent = user.email || "";
  document.getElementById("profileName").value = user.name || "";
  document.getElementById("profileEmail").value = user.email || "";
  document.getElementById("profilePhone").value = user.phone || "";
  document.getElementById("profileAddress").value = user.address || "";
  document.getElementById("profileLatitude").value = user.latitude ?? "";
  document.getElementById("profileLongitude").value = user.longitude ?? "";

  localStorage.setItem("userName", user.name || "");
  localStorage.setItem("userRole", user.role || "user");
  localStorage.setItem("userPhone", user.phone || "");
  localStorage.setItem("userAddress", user.address || "");
  localStorage.setItem("userLatitude", user.latitude ?? "");
  localStorage.setItem("userLongitude", user.longitude ?? "");
}

function renderWishlist() {
  const container = document.getElementById("wishlistList");

  if (!state.wishlist.length) {
    container.innerHTML = '<p class="account-empty">No wishlist items yet.</p>';
    return;
  }

  container.innerHTML = state.wishlist
    .map(
      (item) => `
    <article class="wishlist-card">
      <img src="${escapeHtml(item.image || "/ascets/images/logo.png")}" alt="${escapeHtml(item.name)}">
      <div class="wishlist-body">
        <h3>${escapeHtml(item.name)}</h3>
        <p>${formatMoney(item.price)}</p>
        <div class="wishlist-actions">
          <button class="account-secondary wishlist-cart" type="button" data-id="${escapeHtml(item.productId)}">Add to Cart</button>
          <button class="account-danger wishlist-remove" type="button" data-id="${escapeHtml(item.productId)}">Remove</button>
        </div>
      </div>
    </article>
  `,
    )
    .join("");
}

function renderAddresses() {
  const container = document.getElementById("addressList");

  if (!state.addresses.length) {
    container.innerHTML =
      '<p class="account-empty">No saved addresses yet.</p>';
    return;
  }

  container.innerHTML = state.addresses
    .map(
      (address, index) => `
    <article class="address-card">
      ${address.isDefault ? '<span class="address-default">Default</span>' : ""}
      <h3>${escapeHtml(address.label || `Address ${index + 1}`)}</h3>
      <p>${escapeHtml(address.address)}</p>
      <p>${address.latitude ?? ""}${address.latitude !== null && address.latitude !== undefined ? ", " : ""}${address.longitude ?? ""}</p>
      <div class="address-actions">
        <button class="account-secondary address-default-btn" type="button" data-index="${index}" ${address.isDefault ? "disabled" : ""}>Make Default</button>
        <button class="account-danger address-delete-btn" type="button" data-index="${index}">Delete</button>
      </div>
    </article>
  `,
    )
    .join("");
}

function renderOrders() {
  const container = document.getElementById("orderList");

  if (!state.orders.length) {
    container.innerHTML = '<p class="account-empty">No orders yet.</p>';
    return;
  }

  container.innerHTML = state.orders
    .map(
      (order) => `
    <article class="order-card">
      <h3>Order #${escapeHtml(String(order.id).slice(-8).toUpperCase())}</h3>
      <div class="order-meta">
        <span>${formatDate(order.createdAt)}</span>
        <span>${formatMoney(order.totalAmount)}</span>
        <span class="status-pill">${escapeHtml(order.status || "pending")}</span>
      </div>
      <p>Tracking: ${escapeHtml(order.trackingNumber || "Pending")}</p>
      <ul class="order-items">
        ${(order.items || []).map((item) => `<li>${escapeHtml(item.name)} x ${Number(item.quantity || 1)}</li>`).join("")}
      </ul>
      <div class="order-actions">
        <button class="account-secondary track-order-btn" type="button" data-id="${escapeHtml(order.id)}">Track Order</button>
      </div>
    </article>
  `,
    )
    .join("");
}

function renderTracking(order) {
  const panel = document.getElementById("trackingPanel");
  const history = order.statusHistory || [];

  panel.innerHTML = `
    <h3>Order Tracking</h3>
    <p>Order #${escapeHtml(String(order.id).slice(-8).toUpperCase())}</p>
    <p>Tracking: ${escapeHtml(order.trackingNumber || "Pending")}</p>
    <span class="status-pill">${escapeHtml(order.status || "pending")}</span>
    <ul class="tracking-list">
      ${history
        .map(
          (entry) => `
        <li>
          <strong>${escapeHtml(entry.status)}</strong>
          <span>${formatDate(entry.timestamp)}</span>
          <span>${escapeHtml(entry.note || "")}</span>
        </li>
      `,
        )
        .join("")}
    </ul>
  `;
}

async function saveAddresses(nextAddresses) {
  const data = await authFetch("/auth/addresses", {
    method: "PUT",
    body: JSON.stringify({ addresses: nextAddresses }),
  });

  state.addresses = data.addresses || [];
  const defaultAddress = state.addresses.find((entry) => entry.isDefault);

  if (defaultAddress) {
    localStorage.setItem("userAddress", defaultAddress.address || "");
    localStorage.setItem("userLatitude", defaultAddress.latitude ?? "");
    localStorage.setItem("userLongitude", defaultAddress.longitude ?? "");
  }

  renderAddresses();
  showToast("Addresses saved.", "success");
}

async function loadAccount() {
  const [meData, wishlistData, addressData, orderData] = await Promise.all([
    authFetch("/auth/me"),
    authFetch("/auth/wishlist"),
    authFetch("/auth/addresses"),
    authFetch("/orders"),
  ]);

  state.user = meData.user;
  state.wishlist = wishlistData.wishlist || [];
  state.addresses = addressData.addresses || [];
  state.orders = orderData.orders || [];

  renderUser();
  renderWishlist();
  renderAddresses();
  renderOrders();
}

document
  .getElementById("profileForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const data = await authFetch("/auth/me", {
        method: "PUT",
        body: JSON.stringify({
          name: document.getElementById("profileName").value,
          phone: document.getElementById("profilePhone").value,
          address: document.getElementById("profileAddress").value,
          latitude: document.getElementById("profileLatitude").value,
          longitude: document.getElementById("profileLongitude").value,
        }),
      });

      state.user = data.user;
      renderUser();
      showToast(data.message || "Profile updated.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

document
  .getElementById("passwordForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }

    try {
      const data = await authFetch("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: document.getElementById("currentPassword").value,
          newPassword,
        }),
      });

      event.target.reset();
      showToast(data.message || "Password updated.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

document
  .getElementById("addressForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const makeDefault =
      document.getElementById("addressDefault").checked ||
      state.addresses.length === 0;
    const nextAddresses = state.addresses.map((entry) => ({
      ...entry,
      isDefault: makeDefault ? false : entry.isDefault,
    }));

    nextAddresses.push({
      label: document.getElementById("addressLabel").value || "Home",
      address: document.getElementById("addressText").value,
      latitude: document.getElementById("addressLatitude").value || null,
      longitude: document.getElementById("addressLongitude").value || null,
      isDefault: makeDefault,
    });

    try {
      await saveAddresses(nextAddresses);
      event.target.reset();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

document
  .getElementById("addressList")
  .addEventListener("click", async (event) => {
    const defaultButton = event.target.closest(".address-default-btn");
    const deleteButton = event.target.closest(".address-delete-btn");

    if (!defaultButton && !deleteButton) return;

    const index = Number((defaultButton || deleteButton).dataset.index);
    let nextAddresses = [...state.addresses];

    if (defaultButton) {
      nextAddresses = nextAddresses.map((entry, entryIndex) => ({
        ...entry,
        isDefault: entryIndex === index,
      }));
    }

    if (deleteButton) {
      nextAddresses.splice(index, 1);
      if (
        nextAddresses.length &&
        !nextAddresses.some((entry) => entry.isDefault)
      ) {
        nextAddresses[0].isDefault = true;
      }
    }

    try {
      await saveAddresses(nextAddresses);
    } catch (error) {
      showToast(error.message, "error");
    }
  });

document
  .getElementById("wishlistList")
  .addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".wishlist-remove");
    const cartButton = event.target.closest(".wishlist-cart");

    if (!removeButton && !cartButton) return;

    const productId = (removeButton || cartButton).dataset.id;
    const item = state.wishlist.find((entry) => entry.productId === productId);

    if (!item) return;

    if (cartButton) {
      const trustedProduct = await fetchTrustedProductById(productId);

      window.MADOLOGY_CART.addItem({
        id: productId,
        productId,
        name: trustedProduct?.displayName || trustedProduct?.name || item.name,
        price: Number(trustedProduct?.price ?? item.price ?? 0),
        quantity: 1,
        image: trustedProduct?.image || item.image,
        img: trustedProduct?.image || item.image,
        color: "Default",
        size: "M",
      });
      showToast("Added to cart.", "success");
      return;
    }

    try {
      const data = await authFetch("/auth/wishlist", {
        method: "PUT",
        body: JSON.stringify({
          productId: item.productId,
          name: item.name,
          price: item.price,
          image: item.image,
        }),
      });

      state.wishlist = data.wishlist || [];
      renderWishlist();
      showToast(data.message || "Wishlist updated.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

document
  .getElementById("orderList")
  .addEventListener("click", async (event) => {
    const button = event.target.closest(".track-order-btn");

    if (!button) return;

    try {
      const data = await authFetch(`/orders/${button.dataset.id}/tracking`);
      renderTracking(data.order);
    } catch (error) {
      showToast(error.message, "error");
    }
  });

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActivePanel(tab.dataset.panel));
});

if (!getToken()) {
  window.location.href = "login.html";
} else {
  setActivePanel(panelFromHash());
  loadAccount().catch((error) => showToast(error.message, "error"));
}
