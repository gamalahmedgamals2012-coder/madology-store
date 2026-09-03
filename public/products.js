const API_BASE_URL =
  window.MADOLOGY_GET_API_BASE_URL?.() || window.MADOLOGY_API_BASE_URL || "";

const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
const cartCountBadge = document.querySelector(".cart-num");
const cartPanel = document.getElementById("premiumCartPanel");
const cartIcon = document.getElementById("cart-icon");
const cartOverlay = document.getElementById("cartOverlay");
const scrollTopButton = document.querySelector(".scroll-top-button");
const searchInput = document.getElementById("productSearch");
const sortSelect = document.getElementById("productSort");
const priceSelect = document.getElementById("productPrice");
const filterChips = Array.from(document.querySelectorAll(".filter-chip"));
const productsContainer = document.getElementById("productsContainer");
const productCards = Array.from(document.querySelectorAll(".product-card"));

let activeFilter = "all";
let cartItems = window.MADOLOGY_CART.getItems();
let productsById = new Map();
let cardByProductId = new Map();
let wishlistProductIds = new Set();

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

async function authFetch(path, options = {}) {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Please login first.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    throw new Error(
      data.message || "Your session expired. Please log in again.",
    );
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("en-US")} L.E`;
}

function formatProductPrice(value) {
  return `${Number(value || 0)} L.E`;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getFallbackProduct(card) {
  const name =
    card.querySelector(".product-name")?.textContent?.trim() || "Product";
  const image = card.querySelector("img")?.getAttribute("src") || "";

  return {
    id: card.getAttribute("data-product-id") || slugify(name),
    name: name.toLowerCase(),
    displayName: name,
    price: 0,
    currency: "L.E",
    image,
    category: card.getAttribute("data-category") || "essentials",
    type: card.getAttribute("data-product-type") || "t-shirt",
    colors: normalizeList(
      card.getAttribute("data-product-colors") || "Default",
    ),
    sizes: normalizeList(card.getAttribute("data-product-sizes") || "M"),
    tags: [],
    reviewSummary: {
      averageRating: 0,
      reviewCount: 0,
    },
  };
}

function getCardProduct(card) {
  const productId = card.getAttribute("data-product-id");
  return productsById.get(productId) || getFallbackProduct(card);
}

function getProductMeta(card) {
  const product = getCardProduct(card);
  const searchable = [
    product.name,
    product.displayName,
    product.category,
    product.type,
    ...normalizeList(product.colors),
    ...normalizeList(product.sizes),
    ...normalizeList(product.tags),
  ]
    .join(" ")
    .toLowerCase();

  return {
    name: normalizeName(product.displayName || product.name),
    price: Number(product.price || 0),
    category: product.category || "essentials",
    type: product.type || "t-shirt",
    colors: normalizeList(product.colors).map((entry) => entry.toLowerCase()),
    sizes: normalizeList(product.sizes).map((entry) => entry.toLowerCase()),
    searchable,
  };
}

function populateFilterSelects(filters) {
  if (!filters) return;

  if (priceSelect && filters.price) {
    const maxPrice = Number(filters.price.max || 0);
    const minPrice = Number(filters.price.min || 0);
    priceSelect.innerHTML = '<option value="all">Any price</option>';
    [minPrice, maxPrice]
      .filter((value, index, list) => value && list.indexOf(value) === index)
      .forEach((value) => {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = `Up to ${formatMoney(value)}`;
        priceSelect.appendChild(option);
      });
  }
}

function renderRating(summary) {
  const average = Number(summary?.averageRating || 0);
  const count = Number(summary?.reviewCount || 0);

  if (!count) {
    return "No reviews";
  }

  return `${average.toFixed(average % 1 ? 1 : 0)} / 5 (${count})`;
}

function applyProductToCard(card, product) {
  const imageElement = card.querySelector("img");
  const priceElement = card.querySelector(".product-price");

  card.setAttribute("data-product-id", product.id);
  card.setAttribute("data-category", product.category);
  card.setAttribute("data-product-type", product.type);
  card.setAttribute(
    "data-product-colors",
    normalizeList(product.colors).join(","),
  );
  card.setAttribute(
    "data-product-sizes",
    normalizeList(product.sizes).join(","),
  );
  card.setAttribute("data-product-price", String(product.price));

  if (priceElement) {
    priceElement.textContent = formatProductPrice(product.price);
  }

  if (imageElement) {
    imageElement.dataset.productId = product.id;
  }

  if (!card.querySelector(".product-card-meta")) {
    const price = card.querySelector(".product-price");
    const meta = document.createElement("div");
    meta.className = "product-card-meta";
    meta.innerHTML = `
      <span>${escapeHtml(product.type)}</span>
      <span>${escapeHtml(product.category)}</span>
    `;
    price?.insertAdjacentElement("afterend", meta);
  }

  let rating = card.querySelector(".product-rating");
  if (!rating) {
    rating = document.createElement("button");
    rating.type = "button";
    rating.className = "product-rating";
    rating.setAttribute("data-product-id", product.id);
    card
      .querySelector(".product-card-meta")
      ?.insertAdjacentElement("afterend", rating);
  }
  rating.textContent = renderRating(product.reviewSummary);

  if (!card.querySelector(".product-card-actions")) {
    const actions = document.createElement("div");
    actions.className = "product-card-actions";
    actions.innerHTML = `
      <button class="wishlist-toggle" type="button" data-product-id="${escapeHtml(product.id)}" aria-label="Toggle wishlist">
        <i class="fa-regular fa-heart" aria-hidden="true"></i>
      </button>
      <button class="product-details-btn" type="button" data-product-id="${escapeHtml(product.id)}">Details</button>
    `;
    card.querySelector(".product-info")?.appendChild(actions);
  }
}

function applyProductCatalog(products) {
  const productsByName = new Map();

  products.forEach((product) => {
    productsById.set(product.id, product);
    productsByName.set(normalizeName(product.name), product);
    productsByName.set(normalizeName(product.displayName), product);
  });

  productCards.forEach((card) => {
    const cardName = normalizeName(
      card.querySelector(".product-name")?.textContent,
    );
    const product = productsByName.get(cardName) || getFallbackProduct(card);

    productsById.set(product.id, product);
    cardByProductId.set(product.id, card);
    applyProductToCard(card, product);
  });

  renderWishlistButtons();
}

async function hydrateProductCatalog() {
  productCards.forEach((card) => {
    const product = getFallbackProduct(card);
    productsById.set(product.id, product);
    cardByProductId.set(product.id, card);
    applyProductToCard(card, product);
  });

  try {
    const [productData, filterData] = await Promise.all([
      fetchJson("/products"),
      fetchJson("/products/filters"),
    ]);

    applyProductCatalog(productData.products || []);
    populateFilterSelects(filterData.filters);
  } catch (error) {
    console.warn(
      "[PRODUCTS] Catalog API unavailable, using page catalog.",
      error.message,
    );
  }

  filterAndSortProducts();
}

async function loadWishlist() {
  if (!getStoredToken()) {
    wishlistProductIds = new Set();
    renderWishlistButtons();
    return;
  }

  try {
    const data = await authFetch("/auth/wishlist");
    wishlistProductIds = new Set(
      (data.wishlist || []).map((item) => item.productId),
    );
  } catch (error) {
    console.warn("[PRODUCTS] Wishlist unavailable", error.message);
    wishlistProductIds = new Set();
  }

  renderWishlistButtons();
}

function renderWishlistButtons() {
  document.querySelectorAll(".wishlist-toggle").forEach((button) => {
    const productId = button.dataset.productId;
    const isSaved = wishlistProductIds.has(productId);
    button.classList.toggle("saved", isSaved);
    button.setAttribute("aria-pressed", String(isSaved));
    button.innerHTML = `<i class="${isSaved ? "fa-solid" : "fa-regular"} fa-heart" aria-hidden="true"></i>`;
  });
}

async function toggleWishlist(product) {
  try {
    const data = await authFetch("/auth/wishlist", {
      method: "PUT",
      body: JSON.stringify({
        productId: product.id,
        name: product.displayName || product.name,
        price: product.price,
        image: product.image,
      }),
    });

    wishlistProductIds = new Set(
      (data.wishlist || []).map((item) => item.productId),
    );
    renderWishlistButtons();
    window.MADOLOGY_SHOW_TOAST?.(
      data.message || "Wishlist updated.",
      "success",
    );
  } catch (error) {
    window.MADOLOGY_SHOW_TOAST?.(error.message, "error");
  }
}

function filterAndSortProducts() {
  if (!productsContainer || !searchInput || !sortSelect) {
    return;
  }

  const query = searchInput.value.trim().toLowerCase();
  const sortValue = sortSelect.value;
  const selectedMaxPrice =
    priceSelect?.value === "all" ? null : Number(priceSelect?.value);

  const visibleCards = productCards.filter((card) => {
    const meta = getProductMeta(card);
    const categoryMatch =
      activeFilter === "all" || meta.category === activeFilter;
    const priceMatch =
      selectedMaxPrice === null || meta.price <= selectedMaxPrice;
    const queryMatch =
      !query ||
      meta.searchable.includes(query) ||
      meta.name.includes(query) ||
      normalizeName(card.querySelector(".product-name")?.textContent).includes(
        query,
      );
    return categoryMatch && priceMatch && queryMatch;
  });

  visibleCards.sort((a, b) => {
    const metaA = getProductMeta(a);
    const metaB = getProductMeta(b);

    switch (sortValue) {
      case "name-asc":
        return metaA.name.localeCompare(metaB.name);
      case "name-desc":
        return metaB.name.localeCompare(metaA.name);
      case "price-asc":
        return metaA.price - metaB.price;
      case "price-desc":
        return metaB.price - metaA.price;
      default:
        return 0;
    }
  });

  productCards.forEach((card) => {
    card.style.display = "none";
  });

  visibleCards.forEach((card) => {
    card.style.display = "block";
    productsContainer.appendChild(card);
  });

  if (!visibleCards.length) {
    const emptyState = document.getElementById("productsEmptyState");
    if (!emptyState) {
      const message = document.createElement("div");
      message.id = "productsEmptyState";
      message.className = "products-empty-state";
      message.innerHTML =
        "<h3>No products found</h3><p>Try a different search term or reset the filters.</p>";
      productsContainer.appendChild(message);
    }
  } else {
    const emptyState = document.getElementById("productsEmptyState");
    if (emptyState) {
      emptyState.remove();
    }
  }
}

function createProductModal() {
  if (document.getElementById("productDetailsModal")) {
    return;
  }

  const modal = document.createElement("div");
  modal.id = "productDetailsModal";
  modal.className = "product-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="product-modal-backdrop" data-close-product-modal></div>
    <section class="product-modal-content" role="dialog" aria-modal="true" aria-labelledby="productModalTitle">
      <button class="product-modal-close" type="button" data-close-product-modal aria-label="Close product details">x</button>
      <div id="productModalBody"></div>
    </section>
  `;
  document.body.appendChild(modal);
}

function openModalShell() {
  const modal = document.getElementById("productDetailsModal");
  modal.hidden = false;
  document.body.classList.add("product-modal-open");
}

function closeProductModal() {
  const modal = document.getElementById("productDetailsModal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("product-modal-open");
}

function renderReviewList(reviews) {
  if (!reviews.length) {
    return '<p class="product-modal-empty">No reviews yet.</p>';
  }

  return reviews
    .map(
      (review) => `
    <article class="review-card">
      <div>
        <strong>${escapeHtml(review.userName || "MADOLOGY customer")}</strong>
        <span>${Number(review.rating || 0)} / 5</span>
      </div>
      <p>${escapeHtml(review.comment || "")}</p>
      <small>${formatDate(review.createdAt)}</small>
    </article>
  `,
    )
    .join("");
}

function renderRelatedProducts(products) {
  if (!products.length) {
    return '<p class="product-modal-empty">No related products found.</p>';
  }

  return products
    .map(
      (product) => `
    <article class="related-card">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.displayName || product.name)}">
      <div>
        <h4>${escapeHtml(product.displayName || product.name)}</h4>
        <p>${formatMoney(product.price)}</p>
        <button class="related-view" type="button" data-product-id="${escapeHtml(product.id)}">View</button>
      </div>
    </article>
  `,
    )
    .join("");
}

function renderProductModal(product, reviewsData, relatedProducts) {
  const body = document.getElementById("productModalBody");
  const summary = reviewsData?.summary ||
    product.reviewSummary || { averageRating: 0, reviewCount: 0 };
  const reviews = reviewsData?.reviews || [];
  const canReview = Boolean(getStoredToken());

  body.innerHTML = `
    <div class="product-modal-grid">
      <img class="product-modal-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.displayName || product.name)}">
      <div class="product-modal-info">
        <p class="product-modal-kicker">${escapeHtml(product.category)} / ${escapeHtml(product.type)}</p>
        <h2 id="productModalTitle">${escapeHtml(product.displayName || product.name)}</h2>
        <p class="product-modal-price">${formatMoney(product.price)}</p>
        <div class="product-modal-options">
          <span>${normalizeList(product.colors).map(escapeHtml).join(" / ")}</span>
          <span>${normalizeList(product.sizes).map(escapeHtml).join(" / ")}</span>
        </div>
        <button class="add-to-cart-btn modal-add-cart" type="button" data-product-id="${escapeHtml(product.id)}">Add To Cart</button>
      </div>
    </div>
    <div class="product-modal-section">
      <div class="product-modal-heading">
        <h3>Reviews</h3>
        <span>${renderRating(summary)}</span>
      </div>
      ${
        canReview
          ? `
        <form class="review-form" id="productReviewForm" data-product-id="${escapeHtml(product.id)}">
          <select id="reviewRating" required>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
          <textarea id="reviewComment" rows="3" maxlength="500" placeholder="Share your review"></textarea>
          <button class="account-primary" type="submit">Submit Review</button>
        </form>
      `
          : '<a class="modal-login-link" href="login.html">Login to review</a>'
      }
      <div class="reviews-list">
        ${renderReviewList(reviews)}
      </div>
    </div>
    <div class="product-modal-section">
      <div class="product-modal-heading">
        <h3>Related Products</h3>
      </div>
      <div class="related-grid">
        ${renderRelatedProducts(relatedProducts)}
      </div>
    </div>
  `;
}

async function openProductDetails(productId) {
  const fallbackProduct = productsById.get(productId);

  if (!fallbackProduct) {
    return;
  }

  openModalShell();
  document.getElementById("productModalBody").innerHTML =
    '<p class="product-modal-empty">Loading product...</p>';

  const [productResult, reviewsResult, relatedResult] =
    await Promise.allSettled([
      fetchJson(`/products/${encodeURIComponent(productId)}`),
      fetchJson(`/products/${encodeURIComponent(productId)}/reviews`),
      fetchJson(`/products/${encodeURIComponent(productId)}/related`),
    ]);

  const product =
    productResult.status === "fulfilled"
      ? productResult.value.product
      : fallbackProduct;
  const reviewsData =
    reviewsResult.status === "fulfilled"
      ? reviewsResult.value
      : {
          summary: product.reviewSummary,
          reviews: [],
        };
  const relatedProducts =
    relatedResult.status === "fulfilled"
      ? relatedResult.value.products || []
      : [];

  productsById.set(product.id, product);
  renderProductModal(product, reviewsData, relatedProducts);
}

function openAddToCartModal(product, quantity = 1) {
  const token = getStoredToken();

  if (!token) {
    window.MADOLOGY_SHOW_TOAST?.(
      "Please login first to add products.",
      "error",
    );
    return;
  }

  ATC_MODAL.open({
    id: product.id,
    name: product.displayName || product.name,
    price: Number(product.price || 0),
    quantity,
    image: product.image,
    color: normalizeList(product.colors)[0] || "Default",
  });
}

updateCartCount();
renderCart();
createProductModal();
hydrateProductCatalog();
loadWishlist();

addToCartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const token = getStoredToken();

    if (!token) {
      window.MADOLOGY_SHOW_TOAST?.(
        "Please login first to add products.",
        "error",
      );
      return;
    }

    const productCard = button.closest(".product-card");
    const product = getCardProduct(productCard);
    const quantity =
      parseInt(productCard.querySelector("input").value, 10) || 1;

    openAddToCartModal(product, quantity);
  });
});

document.addEventListener("cart-updated", () => {
  cartItems = window.MADOLOGY_CART.getItems();
  updateCartCount();
  renderCart();
});

function updateCartCount() {
  cartItems = window.MADOLOGY_CART.getItems();
  const totalQuantity = cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  cartCountBadge.innerText = totalQuantity;
}

if (searchInput) {
  searchInput.addEventListener("input", () => filterAndSortProducts());
}

[sortSelect, priceSelect].forEach(
  (select) => {
    select?.addEventListener("change", filterAndSortProducts);
  },
);

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter || "all";
    filterChips.forEach((entry) =>
      entry.classList.toggle("active", entry === chip),
    );
    filterAndSortProducts();
  });
});

productsContainer.addEventListener("click", (event) => {
  const wishlistButton = event.target.closest(".wishlist-toggle");
  const detailsButton = event.target.closest(
    ".product-details-btn, .product-rating",
  );

  if (wishlistButton) {
    event.preventDefault();
    const product = productsById.get(wishlistButton.dataset.productId);
    if (product) {
      toggleWishlist(product);
    }
    return;
  }

  if (detailsButton) {
    event.preventDefault();
    openProductDetails(detailsButton.dataset.productId);
  }
});

document
  .getElementById("productDetailsModal")
  .addEventListener("click", async (event) => {
    if (event.target.closest("[data-close-product-modal]")) {
      closeProductModal();
      return;
    }

    const addButton = event.target.closest(".modal-add-cart");
    if (addButton) {
      const product = productsById.get(addButton.dataset.productId);
      if (product) {
        openAddToCartModal(product, 1);
      }
      return;
    }

    const relatedButton = event.target.closest(".related-view");
    if (relatedButton) {
      openProductDetails(relatedButton.dataset.productId);
    }
  });

document
  .getElementById("productDetailsModal")
  .addEventListener("submit", async (event) => {
    const form = event.target.closest("#productReviewForm");

    if (!form) return;

    event.preventDefault();

    try {
      await authFetch(
        `/products/${encodeURIComponent(form.dataset.productId)}/reviews`,
        {
          method: "POST",
          body: JSON.stringify({
            rating: Number(document.getElementById("reviewRating").value),
            comment: document.getElementById("reviewComment").value,
          }),
        },
      );

      window.MADOLOGY_SHOW_TOAST?.("Review submitted.", "success");
      await openProductDetails(form.dataset.productId);
    } catch (error) {
      window.MADOLOGY_SHOW_TOAST?.(error.message, "error");
    }
  });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeProductModal();
  }
});

function renderCart() {
  cartItems = window.MADOLOGY_CART.getItems();
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = cartItems.length ? 12 : 0;
  const total = subtotal + shipping;

  const itemsMarkup = cartItems.length
    ? cartItems
        .map(
          (item) => `
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
    `,
        )
        .join("")
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
        <button class="premium-order-btn" id="premiumOrderBtn" ${cartItems.length ? "" : "disabled"}>Order from cart</button>
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
  if (cartPanel.classList.contains("show")) {
    closeCart();
    return;
  }

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

    const nextQuantity =
      action === "increase" ? item.quantity + 1 : item.quantity - 1;
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
      window.MADOLOGY_SHOW_TOAST?.("Your cart is empty.", "error");
      return;
    }

    const token = getStoredToken();

    if (!token) {
      window.MADOLOGY_SHOW_TOAST?.("Please login first.", "error");
      return;
    }

    if (!isJwtLike(token)) {
      console.warn("[ORDER DEBUG] Refusing to send malformed token", {
        tokenLength: token.length,
        tokenPreview: `${token.slice(0, 8)}...`,
      });
      localStorage.removeItem("token");
      window.MADOLOGY_SHOW_TOAST?.(
        "Your session token is invalid. Please log in again.",
        "error",
      );
      return;
    }

    orderButton.disabled = true;
    orderButton.textContent = "Ordering...";

    try {
      let customerPhone = localStorage.getItem("userPhone") || "";
      if (!customerPhone) {
        customerPhone =
          window.prompt("Enter your phone number for delivery:") || "";
      }

      const customerAddress = localStorage.getItem("userAddress") || "";
      const customerLatitude = localStorage.getItem("userLatitude") || "";
      const customerLongitude = localStorage.getItem("userLongitude") || "";

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: currentItems,
          customer: {
            phone: customerPhone.trim(),
            address: customerAddress,
            latitude: customerLatitude ? Number(customerLatitude) : null,
            longitude: customerLongitude ? Number(customerLongitude) : null,
          },
        }),
      });

      const data = await response.json();
      console.log("[ORDER DEBUG] Order response", {
        status: response.status,
        ok: response.ok,
        message: data.message,
      });

      if (response.status === 401 && data.code === "INVALID_AUTH_TOKEN") {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        window.MADOLOGY_SHOW_TOAST?.(
          data.message || "Your session expired.",
          "error",
        );
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
      window.MADOLOGY_SHOW_TOAST?.("Server error. Try again later.", "error");
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
