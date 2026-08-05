const API_BASE_URL =
  window.MADOLOGY_API_BASE_URL ||
  localStorage.getItem("apiBaseUrl") ||
  "http://localhost:3000";

const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
const cartCountBadge = document.querySelector(".cart-num");
const cartPanel = document.getElementById("premiumCartPanel");
const cartIcon = document.getElementById("cart-icon");
const cartOverlay = document.getElementById("cartOverlay");
const scrollTopButton = document.querySelector(".scroll-top-button");

let cartItems = window.MADOLOGY_CART.getItems();

function getStoredToken() {
  const rawToken = localStorage.getItem("token");

  if (!rawToken) {
    return "";
  }

  let token = rawToken.trim();

  if (token === "null" || token === "undefined") {
    localStorage.removeItem("token");
    return "";
  }

  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
    localStorage.setItem("token", token);
  }

  return token;
}

function isJwtLike(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

updateCartCount();
renderCart();

addToCartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const token = getStoredToken();

    if (!token) {
      alert("Please login first to add products!");
      return;
    }

    const productCard = button.closest(".product-card");
    const productName = productCard.querySelector(".product-name").innerText;
    const productPrice = parseFloat(productCard.querySelector(".product-price").innerText.replace(" L.E", ""));
    const quantity = parseInt(productCard.querySelector("input").value);
    const productImage = productCard.querySelector("img").src;

    const productId = productCard.getAttribute("data-product-id") || productImage;
    const productColor = productCard.getAttribute("data-product-color") || "Default";

    // Open the modal instead of adding immediately
    ATC_MODAL.open({
      id: productId,
      name: productName,
      price: productPrice,
      quantity,
      image: productImage,
      color: productColor
    });
  });
});

// Listen for cart-updated event dispatched by ATC_MODAL
document.addEventListener("cart-updated", () => {
  cartItems = window.MADOLOGY_CART.getItems();
  updateCartCount();
  renderCart();
});

function updateCartCount() {
  cartItems = window.MADOLOGY_CART.getItems();
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  cartCountBadge.innerText = totalQuantity;
}

function renderCart() {
  cartItems = window.MADOLOGY_CART.getItems();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = cartItems.length ? 12 : 0;
  const total = subtotal + shipping;

  const itemsMarkup = cartItems.length
    ? cartItems.map((item) => `
      <article class="premium-cart-item">
        <img src="${item.image || item.img}" alt="${item.name}">
        <div class="premium-cart-item-info">
          <h3>${item.name}</h3>
          <div class="premium-cart-meta">Color: ${item.color || "Default"} - Size: ${item.size || "One Size"}</div>
          <div class="premium-cart-price">${item.price * item.quantity} L.E</div>
          <div class="premium-cart-actions">
            <div class="premium-qty">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
            </div>
            <button class="premium-remove" data-id="${item.id}">Remove</button>
          </div>
        </div>
      </article>
    `).join("")
    : `
      <div class="premium-empty">
        <svg viewBox="0 0 160 160" width="90" height="90" fill="none" aria-hidden="true">
          <path d="M49 59h62l-5 44H55L49 59Z" stroke="#fb923c" stroke-width="6" stroke-linejoin="round"/>
          <path d="M42 59h76" stroke="#fb923c" stroke-width="6" stroke-linecap="round"/>
          <path d="M60 59a20 20 0 1 1 40 0" stroke="#fb923c" stroke-width="6" stroke-linecap="round"/>
          <circle cx="63" cy="118" r="7" fill="#fb923c"/>
          <circle cx="98" cy="118" r="7" fill="#fb923c"/>
        </svg>
        <h3>Your cart is empty</h3>
        <p>Add your favorite pieces and they will appear here instantly.</p>
      </div>
    `;

  cartPanel.innerHTML = `
    <div class="premium-cart-header">
      <div class="premium-cart-topline">
        <div>
          <p>Shopping Cart</p>
          <h2>Your bag</h2>
        </div>
        <button class="premium-cart-close" id="closePremiumCart" type="button" aria-label="Close cart">x</button>
      </div>
    </div>
    <div class="premium-cart-body">
      ${itemsMarkup}
    </div>
    <div class="premium-cart-footer">
      <div class="premium-summary-card">
        <div class="premium-summary-row"><span>Subtotal</span><span>${subtotal} L.E</span></div>
        <div class="premium-summary-row"><span>Shipping</span><span>${shipping} L.E</span></div>
        <div class="premium-summary-total">
          <span class="summary-total-label">Total</span>
          <strong>${total} L.E</strong>
        </div>
        <button class="premium-order-btn" id="premiumOrderBtn" ${cartItems.length ? "" : "disabled"}>Order from  cart</button>
      </div>
    </div>
  `;
}

function openCart() {
  renderCart();
  cartPanel.classList.add("show");
  cartOverlay.classList.add("show");
}

function closeCart() {
  cartPanel.classList.remove("show");
  cartOverlay.classList.remove("show");
}

cartIcon.addEventListener("click", (event) => {
  event.stopPropagation();
  openCart();
});

cartPanel.addEventListener("click", async (event) => {
  event.stopPropagation();

  const quantityButton = event.target.closest(".qty-btn");
  if (quantityButton) {
    event.preventDefault();
    const id = quantityButton.getAttribute("data-id");
    const action = quantityButton.getAttribute("data-action");
    const currentItems = window.MADOLOGY_CART.getItems();
    const item = currentItems.find((entry) => String(entry.id) === String(id));
    if (!item) return;

    const nextQuantity = action === "increase" ? item.quantity + 1 : item.quantity - 1;
    window.MADOLOGY_CART.updateQuantity(item.id, nextQuantity);
    updateCartCount();
    renderCart();
    return;
  }

  const removeButton = event.target.closest(".premium-remove");
  if (removeButton) {
    event.preventDefault();
    window.MADOLOGY_CART.removeItem(removeButton.getAttribute("data-id"));
    updateCartCount();
    renderCart();
    return;
  }

  const closeButton = event.target.closest("#closePremiumCart");
  if (closeButton) {
    event.preventDefault();
    closeCart();
    return;
  }

  const orderButton = event.target.closest("#premiumOrderBtn");
  if (orderButton) {
    event.preventDefault();

    const currentItems = window.MADOLOGY_CART.getItems();
    if (!currentItems.length) {
      alert("Your cart is empty");
      return;
    }

    const token = getStoredToken();

    if (!token) {
      alert("Please login first");
      return;
    }

    if (!isJwtLike(token)) {
      console.warn("[ORDER DEBUG] Refusing to send malformed token", {
        tokenLength: token.length,
        tokenPreview: `${token.slice(0, 8)}...`
      });
      localStorage.removeItem("token");
      alert("Your session token is invalid. Please log in again.");
      return;
    }

    orderButton.disabled = true;
    orderButton.textContent = "Ordering...";

    try {
      let customerPhone = localStorage.getItem("userPhone") || "";
      if (!customerPhone) {
        customerPhone = window.prompt("Enter your phone number for delivery:") || "";
      }

      const customerAddress = localStorage.getItem("userAddress") || "";
      const customerLatitude = localStorage.getItem("userLatitude") || "";
      const customerLongitude = localStorage.getItem("userLongitude") || "";

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          items: currentItems,
          customer: {
            phone: customerPhone.trim(),
            address: customerAddress,
            latitude: customerLatitude ? Number(customerLatitude) : null,
            longitude: customerLongitude ? Number(customerLongitude) : null
          }
        })
      });

      const data = await response.json();
      console.log("[ORDER DEBUG] Order response", {
        status: response.status,
        ok: response.ok,
        message: data.message
      });

      if (response.status === 401 && data.code === "INVALID_AUTH_TOKEN") {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        alert(data.message);
        window.location.href = "login.html";
        return;
      }

      alert(data.message);

      if (response.ok) {
        localStorage.setItem("userPhone", customerPhone.trim());
        window.MADOLOGY_CART.clearCart();
        updateCartCount();
        renderCart();
      } else {
        orderButton.disabled = false;
        orderButton.textContent = "Order from premium cart";
      }
    } catch (error) {
      alert("Server error. Try again later.");
      orderButton.disabled = false;
      orderButton.textContent = "Order from premium cart";
    }
  }
});

cartPanel.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

cartOverlay.addEventListener("click", (event) => {
  if (event.target === cartOverlay) {
    closeCart();
  }
});

scrollTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
