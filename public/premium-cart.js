const cartState = {
  currency: "USD",
  shippingFlatRate: 16,
  taxRate: 0.08,
  items: []
};

const API_BASE_URL =
  window.MADOLOGY_GET_API_BASE_URL?.() || window.MADOLOGY_API_BASE_URL || "";
let trustedPriceMap = null;

const elements = {
  cartList: document.getElementById("cartList"),
  subtotalValue: document.getElementById("subtotalValue"),
  shippingValue: document.getElementById("shippingValue"),
  taxValue: document.getElementById("taxValue"),
  totalValue: document.getElementById("totalValue"),
  checkoutBtn: document.getElementById("checkoutBtn"),
  headerItemsCount: document.getElementById("headerItemsCount")
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cartState.currency
  }).format(value);
}

async function fetchTrustedPriceMap() {
  if (trustedPriceMap) {
    return trustedPriceMap;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    const data = await response.json();
    const products = Array.isArray(data.products) ? data.products : [];

    trustedPriceMap = new Map(
      products.map((product) => [String(product.id), Number(product.price) || 0]),
    );
  } catch (error) {
    trustedPriceMap = new Map();
  }

  return trustedPriceMap;
}

async function syncCartPricesWithCatalog() {
  const priceMap = await fetchTrustedPriceMap();
  if (!priceMap.size) {
    return cartState.items;
  }

  let updated = false;
  const syncedItems = cartState.items.map((item) => {
    const trustedPrice = priceMap.get(String(item.id));

    if (!Number.isFinite(trustedPrice) || trustedPrice <= 0) {
      return item;
    }

    if (Number(item.price) === trustedPrice) {
      return item;
    }

    updated = true;
    return {
      ...item,
      price: trustedPrice
    };
  });

  if (updated) {
    cartState.items = syncedItems;
    window.MADOLOGY_CART.setItems(syncedItems);
  }

  return syncedItems;
}

function getItemCount() {
  return cartState.items.reduce((total, item) => total + item.quantity, 0);
}

function getSubtotal() {
  return cartState.items.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getShipping(subtotal) {
  return subtotal > 0 ? cartState.shippingFlatRate : 0;
}

function getTax(subtotal) {
  return subtotal > 0 ? subtotal * cartState.taxRate : 0;
}

function updateQuantity(id, change) {
  cartState.items = cartState.items.map((item) => {
    if (String(item.id) !== String(id)) {
      return item;
    }

    return {
      ...item,
      quantity: Math.max(1, item.quantity + change)
    };
  });

  window.MADOLOGY_CART.setItems(cartState.items);
  renderCart();
}

function removeItem(id) {
  cartState.items = cartState.items.filter((item) => String(item.id) !== String(id));
  window.MADOLOGY_CART.removeItem(id);
  renderCart();
}

function renderEmptyState() {
  elements.cartList.innerHTML = `
    <div class="animate-rise rounded-[28px] border border-dashed border-slate-200 bg-white p-8 text-center shadow-soft sm:p-12">
      <div class="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-orange-50">
        <svg viewBox="0 0 160 160" class="h-20 w-20 text-orange-400" fill="none" aria-hidden="true">
          <path d="M49 59h62l-5 44H55L49 59Z" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>
          <path d="M42 59h76" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
          <path d="M60 59a20 20 0 1 1 40 0" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
          <circle cx="63" cy="118" r="7" fill="currentColor"/>
          <circle cx="98" cy="118" r="7" fill="currentColor"/>
        </svg>
      </div>
      <h2 class="mt-6 text-2xl font-bold text-slate-900">Your cart feels a little empty</h2>
      <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
        Add a few favorites to see your premium cart experience come to life. Totals and checkout will update instantly.
      </p>
      <a href="products.html" class="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
        Continue shopping
      </a>
    </div>
  `;
}

function renderCartItems() {
  elements.cartList.innerHTML = cartState.items
    .map(
      (item) => `
        <article class="animate-rise rounded-[28px] border border-white/70 bg-white p-4 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-soft sm:p-5">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div class="overflow-hidden rounded-3xl bg-slate-100 sm:h-32 sm:w-32 sm:flex-shrink-0">
              <img src="${item.image}" alt="${item.name}" class="h-52 w-full object-cover transition duration-500 hover:scale-105 sm:h-full" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Signature Edit</p>
                  <h2 class="mt-1 text-xl font-bold text-slate-900">${item.name}</h2>
                  <p class="mt-2 text-sm text-slate-500">Color: ${item.color} - Size: ${item.size}</p>
                </div>
                <div class="text-left lg:text-right">
                  <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Price</p>
                  <p class="mt-1 text-xl font-extrabold text-slate-900">${formatCurrency(item.price)}</p>
                </div>
              </div>

              <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="inline-flex w-fit items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    class="quantity-btn flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-slate-700 transition hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    data-action="decrease"
                    data-id="${item.id}"
                    aria-label="Decrease quantity for ${item.name}">
                    -
                  </button>
                  <span class="min-w-12 px-4 text-center text-sm font-bold text-slate-900">${item.quantity}</span>
                  <button
                    class="quantity-btn flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-slate-700 transition hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    data-action="increase"
                    data-id="${item.id}"
                    aria-label="Increase quantity for ${item.name}">
                    +
                  </button>
                </div>

                <div class="flex items-center justify-between gap-4 sm:justify-end">
                  <button
                    class="remove-btn inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-100"
                    data-id="${item.id}">
                    <span aria-hidden="true">x</span>
                    <span>Remove</span>
                  </button>
                  <div class="text-right">
                    <p class="text-xs uppercase tracking-[0.18em] text-slate-400">Item total</p>
                    <p class="mt-1 text-lg font-extrabold text-slate-900">${formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function bindCartActions() {
  document.querySelectorAll(".quantity-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id);
      const change = button.dataset.action === "increase" ? 1 : -1;
      updateQuantity(id, change);
    });
  });

  document.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", () => {
      removeItem(Number(button.dataset.id));
    });
  });
}

function renderSummary() {
  const subtotal = getSubtotal();
  const shipping = getShipping(subtotal);
  const tax = getTax(subtotal);
  const total = subtotal + shipping + tax;
  const itemCount = getItemCount();
  const isEmpty = cartState.items.length === 0;

  elements.subtotalValue.textContent = formatCurrency(subtotal);
  elements.shippingValue.textContent = formatCurrency(shipping);
  elements.taxValue.textContent = formatCurrency(tax);
  elements.totalValue.textContent = formatCurrency(total);
  elements.headerItemsCount.textContent = itemCount;
  elements.checkoutBtn.disabled = isEmpty;
}

async function renderCart() {
  cartState.items = window.MADOLOGY_CART.getItems();
  cartState.items = await syncCartPricesWithCatalog();

  if (cartState.items.length === 0) {
    renderEmptyState();
  } else {
    renderCartItems();
    bindCartActions();
  }

  renderSummary();
}

elements.checkoutBtn.addEventListener("click", () => {
  if (cartState.items.length === 0) {
    return;
  }

  window.MADOLOGY_SHOW_TOAST?.("Checkout is ready. Connect this button to your payment or order flow.", "info");
});

renderCart();
